const express = require('express');
const { isLoggedIn } = require('../helpers/util')
const router = express.Router();
const currencyFormatter = require('currency-formatter');




module.exports = (db) => {
    router.get('/', isLoggedIn, async (req, res, next) => {
        try {
            const report = await db.query(`SELECT (SELECT SUM(totalsum) FROM purchases) AS purchases,(SELECT SUM(totalsum) FROM sales) AS sales`)
            const { rows: salesTotal } = await db.query('SELECT COUNT(*) AS total FROM sales')
            
            const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, forsort ORDER BY forsort")
            const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, forsort ORDER BY forsort")

            let getMonth = []

            for (let i = 0; i < totalpurchase.length; i++) {
                getMonth.push(totalpurchase[i].monthly)
            }

            let data = totalpurchase.concat(totalsales)
            let newData = {}
            let income = []

            data.forEach(item => {
                if (newData[item.forsort]) {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                } else {
                    newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                }
            });

            for (const key in newData) {
                income.push(newData[key])
            }
            res.render('dashboards/list', {
                success: req.flash('success'),
                error: req.flash('error'),
                currentPage: 'POS - Data Reports',
                user: req.session.user,
                report,
                currencyFormatter,
                salesTotal,
                query: req.query,
                data: income
            })
        } catch (e) {
            res.send(e);
        }
    });   
   
    router.get('/donatChart', isLoggedIn, async (req, res, next) => {
        try {
            const { startdate, enddate } = req.query

            if (startdate != '' && enddate != '') {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time BETWEEN $1 AND $2", [startdate, enddate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time BETWEEN $1 AND $2", [startdate, enddate])
                res.json({ direct, member })
            } else if (startdate) {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time >= $1", [startdate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time >= $1", [startdate])
                res.json({ direct, member })
            } else if (enddate) {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 AND time <= $1", [enddate])
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 AND time <= $1", [enddate])
                res.json({ direct, member })
            } else {
                const { rows: direct } = await db.query("SELECT COUNT(*) FROM sales WHERE customer = 1 ")
                const { rows: member } = await db.query("SELECT COUNT(*) FROM sales WHERE customer != 1 ")
                res.json({ direct, member })
            }
        } catch (error) {
            console.log(error, 'donat')
        }
    });

    router.get('/earnoverview', isLoggedIn, async (req, res, next) => {
        try {
            const { startdate, enddate } = req.query

            if (startdate != '' && enddate != '') {
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time BETWEEN $1 AND $2 GROUP BY monthly, forsort ORDER BY forsort", [startdate, enddate])

                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time BETWEEN $1 AND $2 GROUP BY monthly, forsort ORDER BY forsort", [startdate, enddate])

                let getMonth = []

                for (let i = 0; i < totalpurchase.length; i++) {
                    getMonth.push(totalpurchase[i].monthly)
                }

                let data = totalpurchase.concat(totalsales)
                let newData = {}
                let income = []

                data.forEach(item => {
                    if (newData[item.forsort]) {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                    } else {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                    }
                });

                for (const key in newData) {
                    income.push(Number(newData[key].revenue - newData[key].expense))
                }

                res.json({ getMonth, income })
            } else if (startdate) {
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time >= $1 GROUP BY monthly, forsort ORDER BY forsort", [startdate])

                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time >= $1 GROUP BY monthly, forsort ORDER BY forsort", [startdate])

                let getMonth = []

                for (let i = 0; i < totalpurchase.length; i++) {
                    getMonth.push(totalpurchase[i].monthly)
                }

                let data = totalpurchase.concat(totalsales)
                let newData = {}
                let income = []

                data.forEach(item => {
                    if (newData[item.forsort]) {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                    } else {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                    }
                });

                for (const key in newData) {
                    income.push(Number(newData[key].revenue - newData[key].expense))
                }

                res.json({ getMonth, income })
            } else if (enddate) {
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases WHERE time <= $1 GROUP BY monthly, forsort ORDER BY forsort", [enddate])

                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales WHERE time <= $1 GROUP BY monthly, forsort ORDER BY forsort", [enddate])

                let getMonth = []

                for (let i = 0; i < totalpurchase.length; i++) {
                    getMonth.push(totalpurchase[i].monthly)
                }

                let data = totalpurchase.concat(totalsales)
                let newData = {}
                let income = []

                data.forEach(item => {
                    if (newData[item.forsort]) {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                    } else {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                    }
                });

                for (const key in newData) {
                    income.push(Number(newData[key].revenue - newData[key].expense))
                }

                res.json({ getMonth, income })
            } else {
                const { rows: totalpurchase } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalpurchases FROM purchases GROUP BY monthly, forsort ORDER BY forsort")

                const { rows: totalsales } = await db.query("SELECT to_char(time, 'Mon YY') AS monthly, to_char(time, 'YYMM') AS forsort, sum(totalsum) AS totalsales FROM sales GROUP BY monthly, forsort ORDER BY forsort")

                let getMonth = []

                for (let i = 0; i < totalpurchase.length; i++) {
                    getMonth.push(totalpurchase[i].monthly)
                }

                let data = totalpurchase.concat(totalsales)
                let newData = {}
                let income = []

                data.forEach(item => {
                    if (newData[item.forsort]) {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : newData[item.forsort].expense, revenue: item.totalsales ? item.totalsales : newData[item.forsort].revenue }
                    } else {
                        newData[item.forsort] = { monthly: item.monthly, expense: item.totalpurchases ? item.totalpurchases : 0, revenue: item.totalsales ? item.totalsales : 0 }
                    }
                });

                for (const key in newData) {
                    income.push(Number(newData[key].revenue - newData[key].expense))
                }

                res.json({ getMonth, income })
            }
        } catch (error) {
            console.log(error)
        }
    });
    return router;

}
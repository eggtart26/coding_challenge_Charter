const express = require("express");
const fetch = require('node-fetch')
const moment = require('moment')

const app = express();
const port = 3009;

// app.use('/static', express.static('public'))
const path = require('path');
app.use(express.static(path.join(__dirname, '../public'))) //return static files

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get('/getData', async (req, res) => {
  try {
      const requestOptions = {
          method: 'GET',
          redirect: 'follow'
      };

      let response = await fetch("https://www.energy.gov/sites/prod/files/2020/12/f81/code-12-15-2020.json", requestOptions)
      let result = response = await response.json()
      let aggregates = {}
      for (release of result.releases) {
          if (!aggregates[release.organization]) {
              aggregates[release.organization] = {
                  "orgnization": release.organization,
                  "release_count": 1,
                  "total_labor_hours": release.laborHours,
                  "all_in_production": release.status === "Production",
                  "licenses": release.permissions.licenses.map(license => license.name),
                  "most_active_months": [moment(release.date.created, "YYYY-MM-DD").format("MM")]
              }
          } else {
              aggregates[release.organization] = {
                  "orgnization": release.organization,
                  "release_count": aggregates[release.organization].release_count + 1,
                  "total_labor_hours": aggregates[release.organization].total_labor_hours + release.laborHours,
                  "all_in_production": aggregates[release.organization].all_in_production && release.status === "Production",
                  "licenses": Array.from(new Set(aggregates[release.organization].licenses.concat(release.permissions.licenses.map(license => license.name)))),
                  "most_active_months": Array.from(new Set(aggregates[release.organization].most_active_months.concat([moment(release.date.created, "YYYY-MM-DD").format("MM")])))
              }
          }
      }
      let out = Object.values(aggregates)
      let order = req.query.order ? req.query.order : 'asc'
      if (req.query.orderby && req.query.orderby == "org_name") {
          out.sort(function compare(a, b) {
              if (a.orgnization < b.orgnization) {
                  return ((order == "asc") ? -1 : 1);
              }
              if (a.orgnization > b.orgnization) {
                  return ((order == "asc") ? 1 : -1);
              }
              return 0;
          })
      } else if (req.query.orderby && req.query.orderby == "release_count") {
          out.sort(function compare(a, b) {
              if (a.release_count < b.release_count) {
                  return ((order == "asc") ? -1 : 1);
              }
              if (a.release_count > b.release_count) {
                  return ((order == "asc") ? 1 : -1);
              }
              return 0;
          })
      } else if (req.query.orderby && req.query.orderby == "labor_hours") {
          out.sort(function compare(a, b) {
              if (a.total_labor_hours < b.total_labor_hours) {
                  return ((order == "asc") ? -1 : 1);
              }
              if (a.total_labor_hours > b.total_labor_hours) {
                  return ((order == "asc") ? 1 : -1);
              }
              return 0;
          })
      }
      res.send({ organizations: out })

  }
  catch (error) {
      console.log('error', error)
  };
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

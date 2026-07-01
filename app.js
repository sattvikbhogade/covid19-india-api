 const express = require("express")
const path = require("path")

const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, "covid19India.db")

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//converting snake_case to camelCase
const convertStateObject = (dbObject) => ({
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
})

const convertDistrictObject = (dbObject) => ({
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
})

//API_1
app.get("/states/", async (request, response) => {
    const getStatesQuery =`
        SELECT *
        FROM state;
    `

    const statesArray = await db.all(getStatesQuery)
    response.send(statesArray.map(eachState => convertStateObject(eachState)))
})

//API_2
app.get("/states/:stateId/", async (request, response) => {
    const { stateId } = request.params

    const getStateQuery = `
        SELECT *
        FROM state 
        WHERE state_id = ${stateId};
    `

    const state = await db.get(getStateQuery)
    response.send(convertStateObject(state))
})

//API_3
app.post("/districts/", async (request, response) => {
    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = request.body

    const addDistrictQuery = `
        INSERT INTO district (
        district_name,
        state_id,
        cases,
        cured,
        active,
        deaths
        )
        VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
        );
    `
    await db.run(addDistrictQuery)
    response.send("District Successfully Added")

})

//API_4
app.get("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params

    const getDistrictQuery = `
        SELECT *
        FROM district
        WHERE district_id = ${districtId};
    `

    const district = await db.get(getDistrictQuery)

    response.send(convertDistrictObject(district))
})

//API_5
app.delete("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params

    const deleteDistrictQuery = `
        DELETE FROM district
        WHERE district_id = ${districtId};

    `
    await db.run(deleteDistrictQuery)
    response.send("District Removed")
})

//API_6
app.put("/districts/:districtId/", async (request, response) => {
    const { districtId } = request.params

    const {
        districtName,
        stateId,
        cases,
        cured,
        active,
        deaths,
    } = request.body

    const updateDistrictQuery = `
        UPDATE district
        SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
        WHERE district_id = ${districtId};
    `
    await db.run(updateDistrictQuery)
    response.send("District Details Updated")

})

//API_7
app.get("/states/:stateId/stats/", async (request, response) => {
    const { stateId } = request.params 

    const getStateStatsQuery = `
        SELECT
            SUM(cases) AS totalCases,
            SUM(cured) AS totalCured,
            SUM(active) AS totalActive,
            SUM(deaths) AS totalDeaths
        FROM district 
        WHERE state_id = ${stateId};
    `

    const stats = await db.get(getStateStatsQuery)
    response.send(stats)
})

//API_8 (we have to join state and district tables)
app.get("/districts/:districtId/details/", async (request, response) => {
    const {districtId} = request.params 

    const getStateNameQuery = `
        SELECT
            state.state_name AS stateName 
        FROM district
        INNER JOIN state 
        ON district.state_id = state.state_id 
        WHERE district.district_id = ${districtId};
    `
    const stateName = await db.get(getStateNameQuery)

    response.send(stateName)
})

module.exports = app

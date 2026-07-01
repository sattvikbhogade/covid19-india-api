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

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/")
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//converting snake_case to camelCase
const convertStateObject = dbObject => ({
    stateId: dbObject.state_id,
    stateName: dbOject.state_name,
    population: dbObject.population,
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
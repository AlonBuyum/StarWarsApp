
import './App.css';
import { useEffect, useState } from 'react';
import { Table } from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

//filter the vehicles that even have pilots
function sortVehicles(vehiclesIn) {
  if (!Array.isArray(vehiclesIn) && !vehiclesIn.length) return [];
  else return vehiclesIn.filter(vehicle => vehicle.pilots.length > 0);
}

//merge all of the vehicles pilots into an array of pilot addresses 
function sortVehiclesWithPilots(vehiclesInput) {
  if (!Array.isArray(vehiclesInput) && !vehiclesInput.length) return [];
  else {
    const pilotsFromVehicles = [];
    for (const iterVehicle of vehiclesInput) {
      if (Array.isArray(iterVehicle.pilots) && iterVehicle.pilots.length) {
        pilotsFromVehicles.push(iterVehicle.pilots)
      }
    }
    console.log('======> Got pilotsFromVehicles: ', pilotsFromVehicles);
    return pilotsFromVehicles;
  }
}

async function getPilotsFull(pilotsToGet) {
  if (!Array.isArray(pilotsToGet) && !pilotsToGet.length) return [];
  else {
    const fullPilots = [];
    for (const iterPilot of pilotsToGet) {
      console.log('======> fetching pilot :', iterPilot);
      const res = await fetch(iterPilot);
      const json = await res.json();
      fullPilots.push(json);
      console.log('======> Got full pilot: ', json);
    }
    console.log('======> Got fullPilots: ', fullPilots);
    return fullPilots;
  }
}

async function getPlanetsFull(planetsToGet) {
  if (!Array.isArray(planetsToGet) && !planetsToGet.length) return [];
  else {
    const fullPlanets = [];
    for (const iterPlanet of planetsToGet) {
      console.log('======> fetching planet :', iterPlanet.homeworld);
      const res = await fetch(iterPlanet.homeworld);
      const json = await res.json();
      fullPlanets.push(json);
      console.log('======> Got full planet: ', json);
    }
    console.log('======> Got fullPlanets: ', fullPlanets);
    return fullPlanets;
  }
}

//creates an array of vehicle-pilot-planet objects
async function findPlanetFromVehicles(vehiclesToLookIn, pilotsToLookIn, planetsToLookIn) {
  console.log('======> Inside findPlanetFromVehicles -> got vehiclesToLookIn as ', vehiclesToLookIn, '\n-> got planetsToLookIn as ', planetsToLookIn);
  if (!Array.isArray(vehiclesToLookIn) && !vehiclesToLookIn.length) return [];
  if (!Array.isArray(pilotsToLookIn) && !pilotsToLookIn.length) return [];
  if (!Array.isArray(planetsToLookIn) && !planetsToLookIn.length) return [];
  else {
    const vehiclesPlanetsPilots = [];
    for (const iterVehicle of vehiclesToLookIn) {
      for (const iterVehiclePilot of iterVehicle.pilots) {
        for (const iterPilot of pilotsToLookIn) {
          if (iterPilot.url === iterVehiclePilot) {
            for (const iterPlanet of planetsToLookIn) {
              if (iterPilot.homeworld === iterPlanet.url) {
                vehiclesPlanetsPilots.push(
                  {
                    vehicle: iterVehicle,
                    pilot: iterPilot,
                    planet: iterPlanet
                  })
              }
            }
          }
        }
      }
    }
    return vehiclesPlanetsPilots;

  }
}

//#region  //* bar chart raw data

const divider = 100000000;
const planetNames = ["Alderaan", "Endor", "Tatooine", "Bespin", "Naboo"];

async function sortPlanetsByName(allPlanets, names) {
  if (!Array.isArray(allPlanets) && !allPlanets.length) return [];
  if (!Array.isArray(names) && !names.length) return [];
  else {
    const requestedPlanets = [];
    let result;
    for (const pName of names) {
      result = allPlanets.find(planet => planet.name === pName);
      if (result) requestedPlanets.push({
        name: result.name,
        population: Number(result.population)
      });
    }
    return requestedPlanets;
  }
}
//#endregion
function App() {

  //Hooks
  const [allVehiclesHolder, setAllVehiclesHolder] = useState([]);
  const [allPilotsHolder, setAllPilotsHolder] = useState([]);
  const [allPlanetsHolder, setAllPlanetsHolder] = useState([]);
  const [sortedPlanets, setSortedPlanetsHolder] = useState([]);
  const [vppHolder, setVppHolder] = useState({
    vehicle: {},
    pilot: {},
    planet: {}
  });

  //#region  //* bar chart members

  // bar chart fields
  const maxPopulation = 200;
  const chartHeight = maxPopulation + 20;
  const barWidth = 50;
  const barMargin = 30;
  const numberofBars = sortedPlanets.length;
  let width = numberofBars * (barWidth + barMargin);

  // Calculate highest Population
  const calculateHighestPopulation = async (data) =>
    data.reduce((acc, cur) => {
      const { population } = cur;
      return population > acc ? population : acc;
    }, 0);

  // bar chart Hook
  const [highestPopulation, setHighestPopulation] = useState(0);
  // update bar chart Hook async
  const updatePopulationAsync = async () => {
    const highestPop = await calculateHighestPopulation(sortedPlanets);
    setHighestPopulation(highestPop);
  }
  //#endregion

  //#region  //*fetch method. 

  const fetchData = async () => {
    const res = await fetch("https://swapi.py4e.com/api/vehicles");
    const json = await res.json();
    setAllVehiclesHolder(json.results);
    console.log('======> Got All Vehicles :', json);
    console.log('======> Vehicle with most population is: ', json.results[4]);

    const resPilots = await fetch("https://swapi.py4e.com/api/people");
    const jsonPilots = await resPilots.json();
    console.log('======> Got All Pilots :', jsonPilots);

    const resPlanets = await fetch("https://swapi.py4e.com/api/planets");
    const jsonPlanets = await resPlanets.json();
    console.log('======> Got All Planets :', jsonPlanets);

    return {
      vehicles: json.results,
      pilots: jsonPilots.results,
      planets: jsonPlanets.results,
    };
  }
  //#endregion



  // a way to fetch from all pages. 
  async function fetchPlanets(values = [], number = 1) {
    const resPlanets = await fetch(`https://swapi.py4e.com/api/planets?page=${number}`);
    const { results, next } = await resPlanets.json();

    const sum = [...values, ...results];
    if (next) {
      return await fetchPlanets(sum, number + 1)
    } else {
      return sum;
    }
  }
  //*  sorting logic of the vehicles-pilots-planets
  const sortLogic = async (vehicles) => {

    //find vehicles with pilots
    const sortedVehicles = sortVehicles(vehicles);
    // extract pilots addresses
    const sortedPilots = sortVehiclesWithPilots(sortedVehicles);
    const flatSortedPilots = sortedPilots.flat();

    //get pilots objects from api
    const fullSortedPilots = await getPilotsFull(flatSortedPilots);
    console.log('======> Got full sorted pilots :', fullSortedPilots);

    //get planets objects from api
    const fullSortedPlanets = await getPlanetsFull(fullSortedPilots);
    console.log('======> Got full sorted planets :', fullSortedPlanets);
    const VPPres = await findPlanetFromVehicles(sortedVehicles, fullSortedPilots, fullSortedPlanets);
    console.log('===> Got Vehicles-Planets-Pilots :', VPPres);


    let max = VPPres[0];
    for (const someVPP of VPPres) {
      if (Number(someVPP.planet.population) > Number(max.planet.population)) {
        max = someVPP;
      }
    }
    console.log('👉🏻👉🏻👉🏻 Biggest population Vehicle-Planet-Pilot :', max);
    return max;
  }

  // driver code
  const Logic = async () => {
    const results = await fetchData()
    const VPPobject = await sortLogic(results.vehicles);
    setVppHolder(VPPobject);
    const planets = await fetchPlanets();
    console.log('======> Got ALL planets:', planets);
    const sorted = await sortPlanetsByName(planets, planetNames);
    setSortedPlanetsHolder(sorted);
  }
  // runs driver code
  useEffect(() => {
    Logic()
  }, []);

  useEffect(() => {
    updatePopulationAsync();
    console.log('======> Got sorted planets:', sortedPlanets);
    console.log('======> Got highestPopulation:', highestPopulation);
  }, [highestPopulation, sortedPlanets]);


  return (
    <div className="App">
      <div className='m-4'>
        <Table striped bordered hover className='shadow p-3 mb-5 bg-body rounded'>
          <thead>
            <tr>
              <th scope="row">Vehicle</th>
              <th scope="row">Planet</th>
              <th scope="row">Pilot</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{vppHolder.vehicle.name}</td>
              <td>{vppHolder.planet.name}</td>
              <td>{vppHolder.pilot.name}</td>
            </tr>
            <tr>
              <td></td>
              <td>{vppHolder.planet.population}</td>
              <td></td>
            </tr>
          </tbody>
        </Table>

        <>
          <p className="legend">
            <span className="population">Population</span>
            <span className="highest-population">Highest Population</span>
          </p>

          <Chart height={chartHeight} width={width}>
            {sortedPlanets.map((data, index) => {
              const barHeight = data.population / divider;
              return (
                <Bar
                  key={data.name}
                  x={index * (barWidth + barMargin)}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  planetName={data.name}
                  highestPopulation={highestPopulation}
                />
              );
            })}
          </Chart>
        </>
      </div>
    </div>
  );
}


// inner components
const Chart = ({ children, width, height }) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    width="100%"
    height="70%"
    preserveAspectRatio="xMidYMax meet"
  >
    {children}
  </svg>
);

const Bar = ({ x, y, width, height, planetName, highestPopulation }) => (
  <>

    <rect x={x} y={y - height - 20} width={width} height={height * 2} fill={highestPopulation / divider === height ? `#3581ff` : `#ffcb48`} rx={4} />
    <text x={x + width / 30} y={(y + height) - 5}>{`${planetName}`}</text>
    <text x={(x + width / 2)} y={y - height - 38} text-anchor={"middle"} font-size={"80%"}>
      {`${height}`}
    </text>
    <text x={(x + width / 2)} y={y - height - 25} text-anchor={"middle"} font-size={"80%"}>x 100M</text>
  </>
);

export default App;

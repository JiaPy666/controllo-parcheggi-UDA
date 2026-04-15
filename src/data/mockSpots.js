const ZONES = ['A', 'B', 'C', 'D']

const ZONE_COSTS = {
  A: 6.5,
  B: 5,
  C: 3.5,
  D: 2.5,
}

function padNumber(value) {
  return String(value).padStart(3, '0')
}

function parseSpotId(id) {
  const zone = id.charAt(0)
  const index = Number(id.slice(1))
  return { zone, index }
}

function randomStatusByZone(zone, index) {
  if (zone === 'A') {
    return index % 4 === 0 || index % 7 === 0 ? 'occupied' : 'free'
  }

  if (zone === 'B') {
    return index % 3 === 0 ? 'occupied' : 'free'
  }

  if (zone === 'C') {
    return index % 5 === 0 ? 'occupied' : 'free'
  }

  return index % 2 === 0 || index % 9 === 0 ? 'occupied' : 'free'
}

function isMaintenanceSpot(zone, index) {
  const maintenanceMap = {
    A: [18, 47],
    B: [14, 63, 88],
    C: [22, 57],
    D: [35, 79, 96],
  }

  return maintenanceMap[zone].includes(index)
}

function getParkingTypeByPosition(zone, index) {
  if (zone === 'A' && index >= 1 && index <= 10) return 'disabled'
  if (zone === 'B' && index >= 1 && index <= 12) return 'electric'
  if (zone === 'C' && index >= 91 && index <= 100) return 'motorcycle'
  if (zone === 'D' && index >= 81 && index <= 100) return 'van'
  return 'normal'
}

function getVehicleTypeFromParkingType(parkingType) {
  if (parkingType === 'motorcycle') return 'motorcycle'
  if (parkingType === 'van') return 'van'
  return 'car'
}

function getCost(zone, parkingType) {
  const baseCost = ZONE_COSTS[zone]

  if (parkingType === 'disabled') return 4.5
  if (parkingType === 'electric') return baseCost + 1.5
  if (parkingType === 'motorcycle') return 2
  if (parkingType === 'van') return baseCost + 2

  return baseCost
}

function buildSpot(zone, index) {
  const parkingType = getParkingTypeByPosition(zone, index)
  const vehicleType = getVehicleTypeFromParkingType(parkingType)
  const maintenance = isMaintenanceSpot(zone, index)
  const status = maintenance ? 'free' : randomStatusByZone(zone, index)

  return {
    id: `${zone}${padNumber(index)}`,
    zone,
    status,
    parking_type: parkingType,
    maintenance,
    vehicle_type: vehicleType,
    cost: getCost(zone, parkingType),
    last_updated: new Date().toLocaleString('it-IT'),
  }
}

export function normalizeSpotById(spot) {
  const { zone, index } = parseSpotId(spot.id)
  const parkingType = getParkingTypeByPosition(zone, index)
  const vehicleType = getVehicleTypeFromParkingType(parkingType)

  return {
    ...spot,
    zone,
    parking_type: parkingType,
    vehicle_type: vehicleType,
    cost: getCost(zone, parkingType),
  }
}

const mockSpots = ZONES.flatMap((zone) =>
  Array.from({ length: 100 }, (_, index) => buildSpot(zone, index + 1))
)

export default mockSpots
export function parseCoords(coords: string): [number, number] {
  const [lat, lng] = coords.split(",").map((part) => Number(part.trim()));
  return [lat, lng];
}

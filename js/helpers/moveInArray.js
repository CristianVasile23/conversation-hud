/**
 * [TODO: Add JSDoc]
 */
export function moveInArray(arr, from, to) {
  let item = arr.splice(from, 1);
  arr.splice(to, 0, item[0]);
}

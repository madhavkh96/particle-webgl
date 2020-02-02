//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ArrayTest01.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//
function main() {
//==============================================================================
  console.log("Hello.  Create an (empty) array like this:  var arr = new Array();");
  var arr = new Array();
  console.log("then we get: \n\tarr:", arr, "\tarr.length", arr.length);
  console.log("\tarr[0]:", arr[0], "\tarr[1]:", arr[1], "\tarr[2]:", arr[2]);
  console.log("append strings and numbers like this: arr.push('Howdy'); arr.push(42.3);");
  arr.push("Howdy");
  arr.push(42.3);
  console.log("then we get: \n\tarr:", arr, "\tarr.length", arr.length);
  console.log("\tarr[0]:", arr[0], "\tarr[1]:", arr[1], "\tarr[2]:", arr[2]);
}
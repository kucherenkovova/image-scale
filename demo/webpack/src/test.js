var ImageScale = require('../../../src/image-scale.js')

var img = document.querySelector('img')

var instance = new ImageScale(img)

document.getElementById('fill').addEventListener('click', function() {
  change('fill')
})
document.getElementById('best-fill').addEventListener('click', function() {
  change('best-fill')
})
document.getElementById('best-fit').addEventListener('click', function() {
  change('best-fit')
})
document.getElementById('best-fit-down').addEventListener('click', function() {
  change('best-fit-down')
})
document.getElementById('none').addEventListener('click', function() {
  change('none')
})

function change(method) {
  instance.scale({scale: method})
}

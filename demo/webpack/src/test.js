import ImageScale from '../../../src/image-scale.js'

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
  var element = document.querySelector('img')
  var scaled = new ImageScale(element, method)
}

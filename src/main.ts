const cursor = document.getElementById('fake-cursor')! as HTMLDivElement
const cursor2 = document.getElementById('fake-cursor2')! as HTMLDivElement
const slider1 = document.getElementById('myRange')! as HTMLInputElement
const slider1label = document.getElementById('myRangelabel')! as HTMLLabelElement
const springKSlider = document.getElementById('springK') as HTMLInputElement
const springKSliderlabel = document.getElementById('springKlabel') as HTMLLabelElement
const dampingSlider = document.getElementById('damping') as HTMLInputElement
const dampingSliderlabel = document.getElementById('dampinglabel') as HTMLLabelElement
const lockStrengthSlider = document.getElementById('lockStrength') as HTMLInputElement
const lockStrengthSliderlabel = document.getElementById('lockStrengthlabel') as HTMLLabelElement
const fpsCounter = document.getElementById('fpscounter') as HTMLDivElement

const showRealCursorCheckbox = document.getElementById('showRealCursor') as HTMLInputElement
const lockDampingCheckbox = document.getElementById('lockDamping') as HTMLInputElement

const resetButton = document.getElementById('resetButton') as HTMLButtonElement


const defaultParams = {
  springK: 50000,
  damping: 100,
  lockStrength: 20,   // multiplier
}


let target = { x: innerWidth / 2, y: innerHeight / 2 }
let renderPos = { ...target }
let velocity = { x: 0, y: 0 }

let isLocked = false
let isDragging = false
let lockPos = { x: 0, y: 0 }

const params = { ...defaultParams }


function handlePointerMove(x: number, y: number) {
  target.x = x
  target.y = y

  if (isDragging) {
    if (document.activeElement instanceof HTMLInputElement) {
      updateSliderLock(x, document.activeElement as HTMLInputElement)
    }
    isLocked = true
  }
}

window.addEventListener('pointermove', e => {
  handlePointerMove(e.clientX, e.clientY)
})

window.addEventListener('touchmove', e => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    handlePointerMove(touch.clientX, touch.clientY)
  }
}, { passive: false })

window.addEventListener('touchstart', e => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    handlePointerMove(touch.clientX, touch.clientY)
  }
})


const sliders = [
  { element: slider1 },
  { element: springKSlider },
  { element: dampingSlider },
  { element: lockStrengthSlider }
]

sliders.forEach(({ element }) => {
  if (!element) return
  element.addEventListener('pointerdown', e => {
    isDragging = true
    updateSliderLock(e.clientX, element)
  })
  element.addEventListener('pointerup', () => {
    isDragging = false
    isLocked = false
  })
})

function updateSliderLock(pointerX: number, slider: HTMLInputElement) {
  const rect = slider.getBoundingClientRect()
  const clampedX = Math.min(rect.right, Math.max(rect.left, pointerX))
  const t = (clampedX - rect.left) / rect.width
  const val = Number(slider.min) + t * (Number(slider.max) - Number(slider.min))
  slider.value = `${val}`

  const thumbX = rect.left + t * rect.width
  lockPos.x = thumbX + 7
  lockPos.y = rect.top + rect.height / 2
}


const maxForce = 5000000
const maxVel = 20000

function update(dt: number) {


  let fx = params.springK * (target.x - renderPos.x)
  let fy = params.springK * (target.y - renderPos.y)

  if (isLocked) {
    fx += params.springK * params.lockStrength * (lockPos.x - renderPos.x)
    fy += params.springK * params.lockStrength * (lockPos.y - renderPos.y)
  }

  fx += -params.damping * velocity.x
  fy += -params.damping * velocity.y


  // force limiting
  const force = Math.hypot(fx, fy)
  if (force > maxForce) {
    fx = (fx / force) * maxForce
    fy = (fy / force) * maxForce
  }

  velocity.x += fx * dt
  velocity.y += fy * dt

  // velocity limiting
  const speed = Math.hypot(velocity.x, velocity.y)
  if (speed > maxVel) {
    console.log("b")
    velocity.x = (velocity.x / speed) * maxVel
    velocity.y = (velocity.y / speed) * maxVel
  }

  renderPos.x += velocity.x * dt
  renderPos.y += velocity.y * dt

}

function render() {
  const cursoroffset = { x: 12 - (innerWidth / 2), y: 12 - (innerHeight / 2) }
  cursor.style.transform = `translate(${renderPos.x + cursoroffset.x}px, ${renderPos.y + cursoroffset.y}px)`

  cursor2.style.transform = `translate(${target.x + cursoroffset.x}px, ${target.y + cursoroffset.y}px)`

  const dist = Math.hypot(target.x - renderPos.x, target.y - renderPos.y)
  // set transparency based on distance of real and fake cursor
  const mindist = 100
  const maxdist = 5000
  let alpha = 1
  if (!showRealCursorCheckbox.checked) {
    alpha = Math.max(0, Math.min(1, (dist - mindist) / (maxdist - mindist)))
  }
  cursor2.style.opacity = alpha.toString()
}

function updateParams() {
  params.springK = Number(springKSlider.value)
  if (lockDampingCheckbox.checked) {
    const clampingValue = ((2 * Math.sqrt(params.springK)))

    dampingSlider.value = clampingValue.toString()
    params.damping = 2 * Math.sqrt(params.springK)
  } else {
    params.damping = Number(dampingSlider.value)
  }
  params.lockStrength = Number(lockStrengthSlider.value)

  // Lock damping slider
  if (lockDampingCheckbox.checked) {
    dampingSlider.classList.add("locked")
  } else {
    dampingSlider.classList.remove("locked")
  }

  springKSliderlabel.textContent = springKSlider.value
  dampingSliderlabel.textContent = dampingSlider.value
  lockStrengthSliderlabel.textContent = lockStrengthSlider.value
  slider1label.textContent = slider1.value
}
function setDefaults() {
  // reset to defaults on refresh
  slider1.value = "50"
  springKSlider.value = defaultParams.springK.toString()
  dampingSlider.value = defaultParams.damping.toString()
  lockStrengthSlider.value = defaultParams.lockStrength.toString()

  showRealCursorCheckbox.checked = false
  lockDampingCheckbox.checked = true

  renderPos = { x: innerWidth / 2, y: innerHeight / 2 }
  target = { x: innerWidth / 2, y: innerHeight / 2 }
  velocity = { x: 0, y: 0 }
  lockPos = { x: 0, y: 0 }
  isLocked = false
  isDragging = false

  updateParams()
};

function updateCursorVisibility() {
  if (showRealCursorCheckbox.checked) {
    document.querySelectorAll<HTMLElement>("*").forEach(el => el.style.cursor = 'auto')

  } else {
    document.querySelectorAll<HTMLElement>("*").forEach(el => el.style.cursor = 'inherit')

  }
}
showRealCursorCheckbox.addEventListener('change', updateCursorVisibility)



resetButton.addEventListener('click', setDefaults)

window.addEventListener('DOMContentLoaded', () => {
  setDefaults()
  updateCursorVisibility()
})
window.addEventListener('pageshow', setDefaults)


let frameCount = 0
let lastFpsUpdate = performance.now()
let fps = 0

function updateFps(now: number) {
  frameCount++
  if (now - lastFpsUpdate >= 500) {
    fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
    fpsCounter.textContent = `FPS: ${fps}`
    lastFpsUpdate = now
    frameCount = 0
  }
}


let last = performance.now()
function loop(now = performance.now()) {
  const dt = (now - last) / 1000 // in seconds
  last = now
  updateParams()
  // run physics multiple times at 1000hz
  const physDt = 1 / 1000
  let steps = Math.ceil(dt / physDt)
  for (let i = 0; i < steps; i++) {
    update(Math.min(physDt, dt - i * physDt))
  }
  render()
  updateFps(now)
  requestAnimationFrame(loop)
}



loop();


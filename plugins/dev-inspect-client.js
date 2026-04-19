const root = __WBX_ROOT__
const base = __WBX_BASE__
const targetAttribute = 'data-dev-inspect-target'

let currentTarget

const style = document.createElement('style')
style.setAttribute('type', 'text/css')
style.setAttribute('data-vite-dev-id', 'wallpaper-box-dev-inspect')
style.textContent = `[${targetAttribute}] {
  outline: auto 1px !important;
  cursor: pointer !important;
}
`
document.head.appendChild(style)

function clearOverlay() {
  if (!currentTarget) {
    return
  }

  const target = document.querySelector(`[${targetAttribute}]`)
  if (target instanceof HTMLElement) {
    delete target.dataset.devInspectTarget
  }

  currentTarget = undefined
}

function cleanUp() {
  clearOverlay()
}

function getReactInstanceForElement(element) {
  if ('__REACT_DEVTOOLS_GLOBAL_HOOK__' in window) {
    const { renderers } = window.__REACT_DEVTOOLS_GLOBAL_HOOK__

    for (const renderer of renderers.values()) {
      try {
        const fiber = renderer.findFiberByHostInstance(element)
        if (fiber) {
          return fiber
        }
      } catch {
        // Ignore transient React render states.
      }
    }
  }

  if ('_reactRootContainer' in element) {
    return element._reactRootContainer._internalRoot.current.child
  }

  for (const key in element) {
    if (key.startsWith('__reactFiber')) {
      return element[key]
    }
  }
}

function getFiberPath(fiber) {
  const source = fiber._debugSource ?? fiber._debugInfo
  if (!source) {
    return
  }

  const { columnNumber = 1, fileName, lineNumber = 1 } = source
  return `${fileName}:${lineNumber}:${columnNumber}`
}

function getLayersForElement(element) {
  let instance = getReactInstanceForElement(element)
  const layers = []

  while (instance) {
    const path = getFiberPath(instance)
    if (path) {
      const name =
        typeof instance.type === 'string'
          ? instance.type
          : (instance.type.displayName ?? instance.type.name ?? instance.type.render?.name ?? 'undefined')
      layers.push({ name, path })
    }

    instance = instance._debugOwner
  }

  return layers
}

function getPreferredLayer(layers) {
  return layers.find((layer) => layer.path.startsWith(`${root}/src/`)) ?? layers.find((layer) => layer.path.startsWith(root)) ?? layers[0]
}

async function openInEditor(layerPath) {
  const response = await fetch(`${base}__open-in-editor?file=${encodeURIComponent(layerPath)}`)

  if (response.ok) {
    return
  }

  console.error('[inspect] open-in-editor failed:', await response.text())
}

window.addEventListener('blur', cleanUp)

window.addEventListener('keyup', (event) => {
  if (!event.altKey) {
    cleanUp()
  }
})

window.addEventListener('mousemove', (event) => {
  if (!event.altKey) {
    cleanUp()
    return
  }

  if (!(event.target instanceof HTMLElement)) {
    clearOverlay()
    return
  }

  if (event.target === currentTarget) {
    return
  }

  clearOverlay()
  currentTarget = event.target
  currentTarget.dataset.devInspectTarget = 'true'
})

window.addEventListener(
  'click',
  (event) => {
    if (!event.altKey) {
      return
    }

    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }

    const layers = getLayersForElement(target)
    const preferredLayer = getPreferredLayer(layers)
    if (!preferredLayer) {
      cleanUp()
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()

    void openInEditor(preferredLayer.path).finally(cleanUp)
  },
  true,
)

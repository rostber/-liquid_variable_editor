class LiquidVarsEditor {
  constructor (el, options) {
    const defaultOptions = {
      classWrap: 'lve',
      classValue: 'lve__value',
      classDrop: 'lve__drop',
      classDropItem: 'lve__drop-item',
      classText: 'lve__text',
      classLiquid: 'lve__liquid',
      classLiquidRemove: 'lve__liquid-remove',
      options: [],
      value: '',
      init (value) {},
      change (value) {},
      keydown (el) {},
      focus (el) {},
      blur (el) {}
    }
    this.options = Object.assign(defaultOptions, options)
    this.el = el
    this.elValue = null
    this.elDrop = null
    this.elsText = []
    this.elsLiquid = []
  }
  init () {
    this.renderEl()

    this.parseContent()
    this.options.init(this.options.value)
  }
  renderEl () {
    const tmp_el = document.createElement('div')
    tmp_el.innerHTML = this.getHtmlWrap()
    const el = tmp_el.firstChild
    this.el.parentNode.insertBefore(el, this.el)
    this.el.parentNode.removeChild(this.el)
    this.el = el
    this.elValue = this.el.querySelector('[lve-value]')
    this.elDrop = this.el.querySelector('[lve-drop]')
    this.elDropItems = this.el.querySelectorAll('[lve-drop-item]')
    this.renderItems()
  }
  renderItems () {
    const html = this.options.value.replace(/(.*?)({{.*?}}|$)/gi, (matched, text, liquid) => {
      let str = ''
      if (text) str += this.getHtmlText(text)
      if (liquid) {
        const liquidContent = liquid.replace(/({{|}})/gi, '').trim()
        str += this.getHtmlLiquid(liquidContent)
      }
      return str
    })
    this.elValue.innerHTML = html

    this.elsText = this.elValue.querySelectorAll('[lve-text]')
    this.elsLiquid = this.elValue.querySelectorAll('[lve-liquid]')
    this.elsLiquidRemove = this.elValue.querySelectorAll('[lve-liquid-remove]')

    this.bind()
  }
  getHtmlWrap () {
    return `<div lve class="${this.options.classWrap}"><div lve-value class="${this.options.classValue}"></div><div lve-drop class="${this.options.classDrop}">${this.getHtmlDropList()}</div></div>`
  }
  getHtmlDropList () {
    return this.options.options.map((option) => {
      return `<div lve-drop-item class="${this.options.classDropItem}" data-value="${option[0]}" style="cursor: pointer;">${option[1]}</div>`
    }).join('')
  }
  getHtmlText (value) {
    return `<span lve-text contenteditable="true" style="outline-style: none;" class="${this.options.classText}">${value}</span>`
  }
  getHtmlLiquid (value) {
    let label = value
    for(const option of this.options.options) {
      if (option[0] === value) {
        label = option[1]
        break
      }
    }
    return `<span lve-liquid data-variable="${value}" class="${this.options.classLiquid}" style="cursor: pointer; padding: 0 2px; margin: 0 1px; background-color: #eee; border-radius: 3px; display: inlne-block;">${label}<span lve-liquid-remove class="${this.options.classLiquidRemove}">x</span></span>`
  }
  bind () {
    this.on('onkeydown', this.elsText, (evt) => {
      this.options.keydown(evt)
      setTimeout(() => {
        this.updateValue()
      }, 0)
    })
    this.on('onfocus', this.elsText, (evt) => {
      this.options.focus(evt)
    })
    this.on('onblur', this.elsText, (evt) => {
      this.options.blur(evt)
    })

    this.on('onclick', this.elDropItems, (evt) => {
      console.log('insert liquid', evt.target.dataset.value)
    })

    this.on('onclick', this.elsLiquidRemove, (evt) => {
      evt.stopPropagation()
      const item = evt.target.parentNode
      item.parentNode.removeChild(item)
      this.updateValue()
      this.renderItems()
    })
  }
  on (eventName, els, fn) {
    if (els.length > 0) {
      els.forEach((el) => {
        el[eventName] = fn
      })
    }
    else els[eventName] = fn
  }
  updateValue () {
    this.parseContent()
    this.options.change(this.options.value)
  }
  parseContent () {
    let value = ''
    const elsItems = this.el.querySelectorAll('[lve-text], [lve-liquid]')
    for (const elItem of elsItems) {
      value += elItem.hasAttribute('lve-text') ? elItem.innerHTML : `{{${elItem.dataset.variable}}}`
    }
    this.options.value = value
  }
}

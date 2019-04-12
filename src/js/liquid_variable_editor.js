class LiquidVarsEditor {
  constructor (el, options) {
    const defaultOptions = {
      classWrap: 'lve',
      classRow: 'lve__row',
      classValue: 'lve__value',
      classTools: 'lve__tools',
      classAdd: 'lve__add',
      classDrop: 'lve__drop',
      classDropVisible: 'lve__drop_state_visible',
      classDropItem: 'lve__drop-item',
      classText: 'lve__text',
      classLiquid: 'lve__liquid',
      classLiquidRemove: 'lve__liquid-remove',
      htmlAdd: '+',
      htmlLiquidRemove: 'x',
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
    this.selectionEl = null
    this.selectionPoistion = null
  }
  init () {
    this.render()

    this.parseContent()
    this.options.init(this.options.value)
  }
  render () {
    const tmp_el = document.createElement('div')
    tmp_el.innerHTML = this.getHtmlWrap()
    const el = tmp_el.firstChild
    this.el.parentNode.insertBefore(el, this.el)
    this.el.style.display = 'none'

    this.options.value = this.el.value

    this.elValue = el.querySelector('[lve-value]')
    this.elAdd = el.querySelector('[lve-add]')
    this.elDrop = el.querySelector('[lve-drop]')
    this.elDropItems = el.querySelectorAll('[lve-drop-item]')

    this.renderItems()

    this.bind()
  }
  renderItems () {
    let hasLastText = false
    const html = this.options.value.replace(/(.*?)({{.*?}}|$)/gi, (matched, text, liquid) => {
      let str = ''
      if (text) {
        hasLastText = true
        str += this.getHtmlText(text)
      }
      if (liquid) {
        hasLastText = false
        const liquidContent = liquid.replace(/({{|}})/gi, '').trim()
        str += this.getHtmlLiquid(liquidContent)
      }
      if (!hasLastText) str += this.getHtmlText('')
      return str
    })
    this.elValue.innerHTML = html

    this.bindItems()
  }
  getHtmlWrap () {
    return `<div class="${this.options.classWrap}"><div class="${this.options.classRow}"><div lve-value class="${this.options.classValue}"></div><div class="${this.options.classTools}"><div lve-add class="${this.options.classAdd}">${this.options.htmlAdd}<div lve-drop class="${this.options.classDrop}">${this.getHtmlDropList()}</div></div></div></div></div>`
  }
  getHtmlDropList () {
    return this.options.options.map((option) => {
      return `<div lve-drop-item class="${this.options.classDropItem}" data-value="${option[0]}">${option[1]}</div>`
    }).join('')
  }
  getHtmlText (value) {
    return `<span lve-text contenteditable="true" class="${this.options.classText}">${value}</span>`
  }
  getHtmlLiquid (value) {
    let label = value
    for(const option of this.options.options) {
      if (option[0] === value) {
        label = option[1]
        break
      }
    }
    return `<span lve-liquid data-variable="${value}" class="${this.options.classLiquid}">${label}<span lve-liquid-remove class="${this.options.classLiquidRemove}">${this.options.htmlLiquidRemove}</span></span>`
  }
  bind () {
    this.on('click', this.elAdd, (evt) => {
      evt.stopPropagation()
      this.addClass(this.elDrop, this.options.classDropVisible)
    })
    this.on('click', document, (evt) => {
      this.removeClass(this.elDrop, this.options.classDropVisible)
    })

    this.on('click', this.elDropItems, (evt) => {
      this.insertValue(evt.target.dataset.value)
      this.selectionEl = null
    })
  }
  bindItems () {
    this.elsText = this.elValue.querySelectorAll('[lve-text]')
    this.elsLiquid = this.elValue.querySelectorAll('[lve-liquid]')
    this.elsLiquidRemove = this.elValue.querySelectorAll('[lve-liquid-remove]')

    this.on('keydown', this.elsText, (evt) => {
      this.options.keydown(evt)
      setTimeout(() => {
        this.updateValue()
      }, 0)
    })
    this.on('mousedown mouseup keydown keyup', this.elsText, (evt) => {
      this.selectionPoistion = this.getCaretPosition(evt.target)
    })
    this.on('focus', this.elsText, (evt) => {
      this.options.focus(evt)
      this.selectionEl = evt.target
    })
    this.on('blur', this.elsText, (evt) => {
      this.options.blur(evt)
    })

    this.on('click', this.elsLiquidRemove, (evt) => {
      evt.stopPropagation()
      const item = evt.target.parentNode
      item.parentNode.removeChild(item)
      this.updateValue()
      this.renderItems()
      this.selectionEl = null
    })
  }
  on (eventName, els, fn) {
    if (els.length > 0) {
      els.forEach((el) => {
        this.onEvent(eventName, el, fn)
      })
    }
    else this.onEvent(eventName, els, fn)
  }
  onEvent (eventNames, el, fn) {
    eventNames.split(' ').forEach((eventName) => {
      el.addEventListener(eventName, fn)
    })
  }
  insertValue (value) {
    if (!this.selectionEl) {
      this.options.value += `{{${value}}}`
      this.renderItems()
      this.options.change(this.options.value)
    } else {
      // TODO: добавление внутрь text
      const text = this.selectionEl.innerHTML
      const textLength = text.length
      const textFirst = text.slice(0, this.selectionPoistion)
      const textLast = text.slice(this.selectionPoistion, textLength)

      this.selectionEl.insertAdjacentHTML('beforebegin', this.getHtmlText(textFirst))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlText(textLast))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlLiquid(value))
      this.selectionEl.parentNode.removeChild(this.selectionEl)
      this.bindItems()

      this.updateValue()
    }
  }
  updateValue () {
    this.parseContent()
    this.options.change(this.options.value)
  }
  parseContent () {
    let value = ''
    const elsItems = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
    for (const elItem of elsItems) {
      value += elItem.hasAttribute('lve-text') ? elItem.innerHTML : `{{${elItem.dataset.variable}}}`
    }
    this.options.value = value
  }
  addClass (el, className) {
    if (el.classList) el.classList.add(className)
    else el.className += ' ' + className
  }
  removeClass (el, className) {
    if (el.classList) el.classList.remove(className)
    else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
  }
  getCaretPosition (editableDiv) {
    let caretPos = 0
    let sel, range
    if (window.getSelection) {
      sel = window.getSelection()
      if (sel.rangeCount) {
        range = sel.getRangeAt(0)
        if (range.commonAncestorContainer.parentNode == editableDiv) {
          caretPos = range.endOffset
        }
      }
    } else if (document.selection && document.selection.createRange) {
      range = document.selection.createRange()
      if (range.parentElement() == editableDiv) {
        var tempEl = document.createElement("span")
        editableDiv.insertBefore(tempEl, editableDiv.firstChild)
        var tempRange = range.duplicate()
        tempRange.moveToElementText(tempEl)
        tempRange.setEndPoint("EndToEnd", range)
        caretPos = tempRange.text.length
      }
    }
    return caretPos
  }
}

'use strict'

class LiquidVarsEditorHelpers {
  on (eventNames, els, fn) {
    this.eachFn(els, (el) => {
      for (const eventName of eventNames.split(' ')) el.addEventListener(eventName, fn)
    })
  }
  addClass (els, className) {
    this.eachFn(els, (el) => {
      if (el.classList) el.classList.add(className)
      else el.className += ' ' + className
    })
  }
  removeClass (els, className) {
    this.eachFn(els, (el) => {
      if (el.classList) el.classList.remove(className)
      else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
    })
  }
  eachFn (els, fn) {
    if (!els) return false
    if (els.length > 0) {
      for (const el of els) {
        fn(el)
      }
    } else if (els.length !== 0) fn(els)
  }
  getCaretPosition (element) {
    let caretOffset = 0
    if (typeof window.getSelection !== 'undefined') {
      const range = window.getSelection().getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    } else if (typeof document.selection !== 'undefined' && document.selection.type !== 'Control') {
      const textRange = document.selection.createRange()
      const preCaretTextRange = document.body.createTextRange()
      preCaretTextRange.moveToElementText(element)
      preCaretTextRange.setEndPoint('EndToEnd', textRange)
      caretOffset = preCaretTextRange.text.length
    }
    return caretOffset
  }
  getChildIndex (childElement) {
    const parentElement = childElement.parentNode
    return Array.prototype.indexOf.call(parentElement.children, childElement)
  }
  setCaretEnd (el) {
    el.focus()
    if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
      var range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      var sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } else if (typeof document.body.createTextRange !== 'undefined') {
      var textRange = document.body.createTextRange()
      textRange.moveToElementText(el)
      textRange.collapse(false)
      textRange.select()
    }
  }
  decode (text) {
    return text.replace(new RegExp('&nbsp;', 'gi'), ' ').replace(new RegExp('<br[^>]*>', 'gi'), "\n")
  }
  encode (text) {
    return text.replace(' ', '&nbsp;').replace("\n", '<br />')
  }
}

class LiquidVarsEditorMain extends LiquidVarsEditorHelpers {
  constructor (el, options) {
    super()
    const defaultOptions = {
      classWrap: 'lve',
      classRow: 'lve__row',
      classValue: 'lve__value',
      classTools: 'lve__tools',
      classAdd: 'lve__add',
      classText: 'lve__text',
      classLiquid: 'lve__liquid',
      classLiquidRemove: 'lve__liquid-remove',
      classDrop: 'lve-drop',
      classDropContent: 'lve-drop__content',
      classDropVisible: 'lve-drop_state_visible',
      classDropAlignLeft: 'lve-drop_align_left',
      classDropItem: 'lve-drop__item',
      classDefaultWrap: 'lve-drop__default-wrap',
      classDefaultLabel: 'lve-drop__default-label',
      classDefaultInput: 'lve-drop__default-input',
      htmlAdd: '+',
      htmlLiquidRemove: 'x',
      htmlDefaultLabel: 'По умолчанию:',
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
  }
  init () {
    this.render()

    this.parseContent()
    this.options.init(this.options.value)
  }
  render () {
    const tmpEl = document.createElement('div')
    tmpEl.innerHTML = this.getHtmlWrap()
    const el = tmpEl.firstChild
    this.el.parentNode.insertBefore(el, this.el)
    this.el.style.display = 'none'

    this.options.value = this.el.value

    this.elWrap = el
    this.elValue = el.querySelector('[lve-value]')
    this.elAdd = el.querySelector('[lve-add]')
    this.elAddDrop = el.querySelector('[lve-drop]')

    this.renderItems()
    this.renderDrop()

    this.bind()
  }
  renderItems () {
    let prevElLiquid = false
    let html = this.options.value.replace(new RegExp('(.*?)({{.*?}}|$)', 'gi'), (matched, text, liquid) => {
      let str = ''
      if (text) {
        prevElLiquid = false
        str += this.getHtmlText(text)
      }
      if (!text && prevElLiquid) str += this.getHtmlText('')
      if (liquid) {
        prevElLiquid = true
        const liquidContent = liquid.replace(new RegExp('({{|}})', 'gi'), '').trim().split('|')
        const liquidVariable = liquidContent[0]
        let liquidDefault = null
        if (liquidContent[1]) {
          const res = new RegExp('default: !?("([^"]*)"|\'([^\']*)\')', 'gi').exec(liquidContent[1])
          liquidDefault = res[2] || res[3] || null
        }
        str += this.getHtmlLiquid(liquidVariable.trim(), liquidDefault)
      }
      return str
    })
    this.elValue.innerHTML = html

    this.bindItems()
  }
  renderDrop () {
    const tmpEl = document.createElement('div')
    tmpEl.innerHTML = this.getHtmlDropList()
    document.body.appendChild(tmpEl)
    this.elDrop = tmpEl.firstChild
    this.elDropContent = this.elDrop.querySelector('[lve-drop-content]')
  }
  getHtmlWrap () {
    return `<div class="${this.options.classWrap}"><div class="${this.options.classRow}"><div lve-value class="${this.options.classValue}"></div><div class="${this.options.classTools}"><div lve-add class="${this.options.classAdd}">${this.options.htmlAdd}</div></div></div></div>`
  }
  getHtmlDropList () {
    const defaultInput = `<input type="text" lve-drop-default class="${this.options.classDefaultInput}" />`
    const defaultWrap = `<div class="${this.options.classDefaultWrap}"><label class="${this.options.classDefaultLabel}">${this.options.htmlDefaultLabel}</label>${defaultInput}</div>`
    const list = this.options.options.map((option) => {
      return `<div lve-drop-item class="${this.options.classDropItem}" data-value="${option[0]}">${option[1]}</div>`
    }).join('')
    return `<div lve-drop class="${this.options.classDrop}"><div lve-drop-content class="${this.options.classDropContent}">${defaultWrap}${list}</div></div>`
  }
  getHtmlText (value) {
    return `<span lve-text contenteditable="true" class="${this.options.classText}">${this.encode(value)}</span>`
  }
  getHtmlLiquid (value, defaultValue) {
    defaultValue = defaultValue || ''
    let label = value
    for (const option of this.options.options) {
      if (option[0] === value) {
        label = option[1]
        break
      }
    }
    return `<span lve-liquid data-variable="${value}" data-default="${defaultValue}" class="${this.options.classLiquid}">${label}<span lve-liquid-remove class="${this.options.classLiquidRemove}">${this.options.htmlLiquidRemove}</span></span>`
  }
  bind () {
    this.on('click', this.elAdd, (evt) => {
      evt.stopPropagation()
      this.showDrop()
    })
    this.on('click', document, (evt) => {
      this.hideDrop()
    })
    this.on('click', this.elDrop, (evt) => {
      evt.stopPropagation()
    })
    // При клике внутри блока нужно ставить курсор на последний элемент
    this.on('click', this.elValue, (evt) => {
      evt.stopPropagation()
      evt.preventDefault()
      if (evt.target === this.elValue) {
        const elText = this.elsText[this.elsText.length - 1]
        this.setCaretEnd(elText)
        this.selectionEl = elText
        this.hideDrop()
      }
    })
    this.bindDropContent()
  }
  bindItems () {
    this.elsText = this.elValue.querySelectorAll('[lve-text]')
    this.elsLiquid = this.elValue.querySelectorAll('[lve-liquid]')
    this.elsLiquidRemove = this.elValue.querySelectorAll('[lve-liquid-remove]')
    this.elsDrop = this.elWrap.querySelectorAll('[lve-drop]')

    this.on('keydown', this.elsText, (evt) => {
      this.options.keydown(evt)

      // Определяется нажатие backspace для удаление liquid элементов
      const key = evt.keyCode || evt.charCode
      if (key === 8 || key === 46) {
        if (this.getCaretPosition(evt.target) === 0) {
          const childIndex = this.getChildIndex(this.selectionEl)
          if (childIndex > 0) {
            const elsItems = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
            const prevChildIndex = childIndex - 1
            elsItems[prevChildIndex].parentNode.removeChild(elsItems[prevChildIndex])

            this.updateValue()
            this.renderItems()

            // Курсор устанавливается на элемент перед удаленным или на текущий
            const elsItemsNew = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
            const elFocus = prevChildIndex > 0 ? elsItemsNew[prevChildIndex - 1] : elsItemsNew[prevChildIndex]
            this.setCaretEnd(elFocus)
          }
        }
      }

      setTimeout(() => {
        this.updateValue()
      }, 0)
    })
    this.on('mouseup keyup', this.elsText, (evt) => {
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

    this.on('click', this.elsLiquid, (evt) => {
      evt.stopPropagation()
      this.showDrop(evt.target)
    })
  }
  bindDropContent () {
    this.elDropItems = this.elDrop.querySelectorAll('[lve-drop-item]')
    this.elDropDefault = this.elDrop.querySelector('[lve-drop-default]')

    this.on('click', this.elDropItems, (evt) => {
      if (this.elDropEditLiquid) {
        this.elDropEditLiquid.setAttribute('data-variable', evt.target.dataset.value)
        this.updateValue()
        this.renderItems()
      } else this.insertValue(evt.target.dataset.value, this.elDropDefault.value)

      setTimeout(() => {
        this.hideDrop()
      }, 0)
      this.selectionEl = null
    })

    this.on('change', this.elDropDefault, (evt) => {
      if (this.elDropEditLiquid) this.elDropEditLiquid.setAttribute('data-default', evt.target.value)
      this.updateValue()
      this.selectionEl = null
    })
  }
  showDrop (elDropEditLiquid) {
    this.elDropEditLiquid = elDropEditLiquid

    this.elDrop.style.left = (elDropEditLiquid ? elDropEditLiquid.getBoundingClientRect().left : this.elAdd.getBoundingClientRect().left) + 'px'
    this.elDrop.style.top = (elDropEditLiquid ? elDropEditLiquid.getBoundingClientRect().top : this.elAdd.getBoundingClientRect().top) + 'px'

    this.elDropDefault.value = elDropEditLiquid ? (elDropEditLiquid.dataset.default || '') : ''

    this.hideDrop()
    this.addClass(this.elDrop, this.options.classDropVisible)
    if (this.elDropContent.getBoundingClientRect().left < document.body.offsetWidth / 2) this.addClass(this.elDrop, this.options.classDropAlignLeft)
  }
  hideDrop () {
    this.removeClass(this.elDrop, this.options.classDropVisible)
    this.removeClass(this.elDrop, this.options.classDropAlignLeft)
  }
  insertValue (value, defaultValue) {
    if (!this.selectionEl) {
      // Вставка в конец текста
      this.elValue.insertAdjacentHTML('beforeEnd', this.getHtmlLiquid(value, defaultValue))
    } else {
      // Вставка в середине текста
      const text = this.decode(this.selectionEl.innerHTML)
      const textLength = text.length
      const textFirst = text.slice(0, this.selectionPoistion)
      const textLast = text.slice(this.selectionPoistion, textLength)

      this.selectionEl.insertAdjacentHTML('beforebegin', this.getHtmlText(textFirst))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlText(textLast))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlLiquid(value, defaultValue))
      this.selectionEl.parentNode.removeChild(this.selectionEl)
    }
    this.updateValue()
    this.renderItems()
  }
  updateValue () {
    this.parseContent()
    this.options.change(this.options.value)
  }
  parseContent () {
    let value = ''
    const elsItems = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
    for (const elItem of elsItems) {
      const defaultPostfix = elItem.dataset.default ? ` | default: "${elItem.dataset.default}"` : ''
      value += elItem.hasAttribute('lve-text') ? elItem.innerHTML : `{{${elItem.dataset.variable}${defaultPostfix}}}`
    }
    this.options.value = value
  }
}

class LiquidVarsEditor extends LiquidVarsEditorHelpers {
  constructor (els, options) {
    super()
    this.els = els
    this.options = options
  }
  init () {
    this.eachFn(this.els, (el) => {
      const Lve = new LiquidVarsEditorMain(el, this.options)
      Lve.init()
    })
  }
}

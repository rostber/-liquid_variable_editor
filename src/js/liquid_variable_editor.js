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
  createRange (node, chars, range) {
    if (!range) {
      range = document.createRange()
      range.selectNode(node)
      range.setStart(node, 0)
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count)
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.length < chars.count) {
          chars.count -= node.textContent.length
        } else {
          range.setEnd(node, chars.count)
          chars.count = 0
        }
      } else {
        for (var lp = 0; lp < node.childNodes.length; lp++) {
          range = this.createRange(node.childNodes[lp], chars, range)

          if (chars.count === 0) {
            break
          }
        }
      }
    }
    return range
  }
  setCaretPosition (element, position) {
    const selection = window.getSelection()
    const range = this.createRange(element, { count: position })
    if (range) {
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }
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
    return text.replace(new RegExp('&nbsp;', 'gi'), ' ').replace(new RegExp('<br[^>]*>', 'gi'), '\n')
  }
  encode (text) {
    return text.replace(new RegExp(' ', 'gi'), '&nbsp;').replace(new RegExp('\\n', 'gi'), '<br />')
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
      classDropChilds: 'lve-drop__childs',
      classDropList: 'lve-drop__list',
      classDropItem: 'lve-drop__item',
      classDropItemChilds: 'lve-drop__item_type_childs',
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
    this.elStyleDisplay = el.style.display
  }
  init () {
    this.render()
    this.parseContent()
    this.options.init(this.options.value)
  }
  destroy () {
    this.el.style.display = this.elStyleDisplay
    this.elWrap.parentNode.removeChild(this.elWrap)
    this.elDrop.parentNode.removeChild(this.elDrop)
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

    this.renderDrop()
    this.renderItems()

    this.bind()
  }
  renderItems () {
    let prevElLiquid = false
    let firstEl = true
    let html = this.options.value.replace(new RegExp('(.*?)({{.*?}}|$)', 'gi'), (matched, text, liquid) => {
      let str = ''
      if (text) {
        prevElLiquid = false
        str += this.getHtmlText(text)
      }
      if (!text && (prevElLiquid || firstEl)) str += this.getHtmlText('')
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
        firstEl = false
      }
      return str
    })
    this.elValue.innerHTML = html || this.getHtmlText('')

    this.bindItems()
  }
  renderDrop () {
    const tmpEl = document.createElement('div')
    tmpEl.innerHTML = this.getHtmlDropList()
    this.elDrop = tmpEl.firstChild
    document.body.appendChild(this.elDrop)
    this.elDropContent = this.elDrop.querySelector('[lve-drop-content]')
  }
  getHtmlWrap () {
    return `<div class="${this.options.classWrap}"><div class="${this.options.classRow}"><div lve-value class="${this.options.classValue}"></div><div class="${this.options.classTools}"><div lve-add class="${this.options.classAdd}">${this.options.htmlAdd}</div></div></div></div>`
  }
  getHtmlDropList () {
    const defaultInput = `<input type="text" lve-drop-default class="${this.options.classDefaultInput}" />`
    const defaultWrap = `<div class="${this.options.classDefaultWrap}"><label class="${this.options.classDefaultLabel}">${this.options.htmlDefaultLabel}</label>${defaultInput}</div>`

    this.optionsKeys = {}
    const eachOptions = (items) => {
      let html = ''
      for (const item of items) {
        if (item.childs) html += `<div class="${this.options.classDropItem} ${this.options.classDropItemChilds}">${item.name}<div class="${this.options.classDropChilds}">${eachOptions(item.childs)}</div></div>`
        else {
          html += `<div lve-drop-item class="${this.options.classDropItem}" data-value="${item.key}">${item.name}</div>`
          this.optionsKeys[item.key] = item.name
        }
      }
      return html
    }
    const list = eachOptions(this.options.options)

    return `<div lve-drop class="${this.options.classDrop}"><div lve-drop-content class="${this.options.classDropContent}">${defaultWrap}<div class="${this.options.classDropList}">${list}</div></div></div>`
  }
  getHtmlText (value) {
    return `<span lve-text contenteditable="true" class="${this.options.classText}">${this.encode(value)}</span>`
  }
  getHtmlLiquid (value, defaultValue) {
    defaultValue = defaultValue || ''
    let label = this.optionsKeys[value] ? this.optionsKeys[value] : value
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
    /* this.on('click', this.elValue, (evt) => {
      evt.stopPropagation()
      evt.preventDefault()
      if (evt.target === this.elValue) {
        const elText = this.elsText[this.elsText.length - 1]
        this.setCaretEnd(elText)
        this.selectionEl = elText
        this.hideDrop()
      }
    }) */
    this.bindDropContent()
  }
  bindItems () {
    this.elsText = this.elValue.querySelectorAll('[lve-text]')
    this.elsLiquid = this.elValue.querySelectorAll('[lve-liquid]')
    this.elsLiquidRemove = this.elValue.querySelectorAll('[lve-liquid-remove]')
    this.elsDrop = this.elWrap.querySelectorAll('[lve-drop]')

    this.on('keydown', this.elsText, (evt) => {
      const position = this.getCaretPosition(evt.target)

      // Блокировать ввод liquid
      setTimeout(() => {
        if (new RegExp('{{|{%', 'gi').test(evt.target.innerHTML)) {
          evt.target.innerHTML = evt.target.innerHTML.replace(new RegExp('{{|{%', 'gi'), '{')
          this.setCaretPosition(evt.target, position)
        }
      }, 0)
    })

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
      let el = evt.target.closest('[lve-liquid-remove]') || evt.target
      console.log(el)
      evt.stopPropagation()
      const item = el.parentNode
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

/*export default */class LiquidVarsEditor extends LiquidVarsEditorHelpers {
  constructor (els, options) {
    super()
    this.els = els
    this.options = options
    this.Lve = null
  }
  init () {
    this.eachFn(this.els, (el) => {
      this.Lve = new LiquidVarsEditorMain(el, this.options)
      this.Lve.init()
    })
  }
  destroy () {
    if (this.Lve) this.Lve.destroy()
  }
}

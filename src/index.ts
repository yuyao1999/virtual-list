/** @format */

import { LitElement, css, html } from "lit"
import { customElement, state, property } from "lit/decorators.js"
import { unsafeHTML } from "lit/directives/unsafe-html.js"
import { ref, createRef } from "lit/directives/ref.js"
import { styleMap } from "lit/directives/style-map.js"

@customElement("yy-virtual-list")
export class yyElement extends LitElement {
  //缓冲个数
  @property({ type: Number })
  buffer = 4

  @property({ type: Number })
  page = 1

  @property({ type: Number })
  size = 10

  @property({
    converter: (value: any) => {
      // 字符串转函数
      if (typeof value === "string") {
        return new Function("return " + value)()
      }
      return value
    },
  })
  request = async (_page: number, _size: number) => {}

  @property({ type: Boolean, attribute: "built-in" })
  builtIn = false

  // 容器高度
  @property({ type: String, attribute: "container-styles-string" })
  containerStylesString = "height:50vh;background:#f5f5f5;margin:1rem;"

  @property({ type: Number, attribute: "estimated-height" })
  estimatedHeight = 50

  @property({ type: Boolean, attribute: "height-fixed" })
  heightFixed = false

  @state()
  loading = false
  @state() hasMoreData = true

  @state()
  estimatedItemSize = 50

  @state()
  templateStr = ""

  @state()
  listData = [] as any

  tipsRef = createRef<any>()
  async loadDataList() {
    this.loading = true
    const data: any = await this.request(this.page, this.size)
    if (data?.length === 0) {
      this.loading = false
      this.hasMoreData = false
      return
    }
    this.listData.push(...data)
    if (this.page === 1) {
      this.init()
    } else {
      this.getPositions()
      this.changeListDataKey()
      this.changeVisibleCount()
      this.changeVisibleData()
    }

    let startOffset = this.start >= 1 ? this.positions[this.start - 1]?.bottom : 0
    startOffset = startOffset + this.tipsRef.value.clientHeight
    this.contentRef.value.style.transform = `translate3d(0,${startOffset}px,0)`

    this.loading = false

    return data
  }

  @state()
  listDataKey = [] as any

  changeListDataKey = () => {
    this.listDataKey = this.listData.map((item: any, index: number) => {
      return {
        ...item,
        _index: `_${index}`,
      }
    })
  }

  @state()
  screenHeight = 0

  @state()
  start = 0

  @state()
  end = 0

  @state()
  visibleCount = 0

  @state()
  visibleData = [] as any

  refresh() {
    // 刷新列表
    this.listData = []
    this.loadDataList()
  }

  reload() {
    // 重新加载列表
    this.positions = []
    this.listData = []
    this.page = 1
    this.listRef.value.scrollTo({ top: 0 })
    this.loadDataList()
  }

  changeVisibleCount() {
    this.visibleCount = Math.ceil(this.screenHeight / this.estimatedItemSize)
  }

  changeVisibleData() {
    this.visibleData = this.listDataKey.slice(this.start, this.end)
    this.dispatchEvent(new CustomEvent("change", { detail: this.visibleData }))
  }

  @state()
  positions = [] as any

  getPositions() {
    this.positions.push(
      ...this.listData.slice(this.positions.length, this.listData.length).map((_: any, index: number) => {
        const indexRes = this.positions.length + index
        return {
          index: this.positions.length + index,
          height: this.estimatedItemSize,
          top: indexRes * this.estimatedItemSize,
          bottom: (indexRes + 1) * this.estimatedItemSize,
        }
      })
    )
  }

  listRef = createRef<any>()
  phantomRef = createRef<any>()
  contentRef = createRef<any>()
  itemsRef = createRef<any>()

  firstUpdated() {
    this.initStyle()
    this.loadDataList()
    this.init()
    this.estimatedItemSize = this.estimatedHeight
  }

  init() {
    this.screenHeight = this.listRef.value?.clientHeight || 0
    this.changeListDataKey()
    this.changeVisibleCount()
    this.end = this.visibleCount + this.buffer * 2
    this.changeVisibleData()
    this.getPositions()
  }

  @state()
  containerStyles = {} as any

  initStyle() {
    const arr = this.containerStylesString.trim().split(";").filter(Boolean)
    for (const item of arr) {
      const [key, value] = item.split(":")
      this.containerStyles[key.trim()] = value.trim()
    }
  }

  fillTemplate(templateString: string, templateVars: any) {
    const resTemp = decodeURIComponent(templateString)
    return new Function("return `" + resTemp + "`;").call(templateVars)
  }

  getStartIndex = (scrollTop: number = 0) => {
    const index = this.binarySearch(this.positions, scrollTop) || 0
    return index < this.buffer ? 0 : index - this.buffer
  }
  binarySearch = (list: any[], value: number) => {
    let start = 0
    let end = list.length - 1
    let tempIndex = null
    while (start <= end) {
      let midIndex = Math.floor((start + end) / 2)
      let midValue = list[midIndex].bottom
      if (midValue === value) {
        return midIndex + 1
      } else if (midValue < value) {
        start = midIndex + 1
      } else if (midValue > value) {
        if (tempIndex === null || tempIndex > midIndex) {
          tempIndex = midIndex
        }
        end = end - 1
      }
    }
    return tempIndex
  }

  //获取当前的偏移量
  setStartOffset() {
    let startOffset = this.start >= 1 ? this.positions[this.start - 1]?.bottom : 0
    this.contentRef.value.style.transform = `translate3d(0,${startOffset}px,0)`
  }

  handleRequestMore(scrollTop: number) {
    if (this.loading || !this.hasMoreData) return
    const clientHeight = this.listRef.value.clientHeight
    if (scrollTop + clientHeight > this.positions[this.positions.length - 1].top) {
      this.page++
      this.loadDataList()
    }
  }

  scrollEvent() {
    //当前滚动位置
    const scrollTop = this.listRef.value.scrollTop
    //此时的开始索引
    this.start = this.getStartIndex(scrollTop) || 0
    //此时的结束索引
    this.end = this.start + this.visibleCount + this.buffer * 2
    this.changeVisibleData()
    //此时的偏移量
    this.setStartOffset()
    this.handleRequestMore(scrollTop)
  }
  updateItemsSize() {
    if (this.heightFixed) return
    let nodes = this.contentRef.value!.children || []
    if (!this.templateStr) {
      //将slot 内容作为模板
      const slots = []
      for (const node of nodes) {
        // 只要 slot 没有name的
        node?.assignedNodes && slots.push(...node.assignedNodes())
      }
      nodes = slots
    }
    for (const node of nodes) {
      if (!node || !node?.getBoundingClientRect) continue
      let rect = node.getBoundingClientRect()
      if (!rect.height) continue
      let height = rect.height

      let index = +node.id.slice(1)
      let oldHeight = this.positions[index]?.height
      let dValue = oldHeight - height
      //存在差值
      if (dValue) {
        this.positions[index].bottom = this.positions[index].bottom - dValue
        this.positions[index].height = height
        for (let k = index + 1; k < this.positions.length; k++) {
          this.positions[k].top = this.positions[k - 1].bottom
          this.positions[k].bottom = this.positions[k].bottom - dValue
        }
      }
    }
  }

  updated() {
    //获取真实元素大小，修改对应的尺寸缓存
    this.updateItemsSize()
    const height = this.positions[this.positions.length - 1]?.bottom
    this.phantomRef.value.style.height = height + "px"
    //更新真实偏移量
    this.setStartOffset()
    if (this.estimatedItemSize === this.estimatedHeight && this.positions[0]?.height) {
      this.estimatedItemSize = this.positions[0].height
    }
  }

  render() {
    if (this.builtIn) {
      const template = this.querySelector("yy-template")!
      this.templateStr = template?.innerHTML || ""
    }
    return html`
      <!-- <div>${html`${this.start}-${this.end}`}</div> -->
      <div class="infinite-list-container" style=${styleMap(this.containerStyles)} ${ref(this.listRef)} id="list" @scroll="${this.scrollEvent}">
        <div class="infinite-list-phantom" ${ref(this.phantomRef)}></div>
        <div class="infinite-list" ${ref(this.contentRef)}>
          ${html`
            ${this.templateStr
              ? this.visibleData.map(
                  (item: any) => html`<div ${ref(this.itemsRef)} .id="${item._index}">${unsafeHTML(this.fillTemplate(this.templateStr, item))}</div>`
                )
              : html`<slot></slot>`}
          `}
          <div ${ref(this.tipsRef)}>
            ${this.loading
              ? html`<slot name="loading">
                  <div class="loading">正在加载中~</div>
                </slot>`
              : null}
            ${!this.hasMoreData && this.page !== 1
              ? html`<slot name="loaded">
                  <div class="loaded">没有更多数据了~</div>
                </slot>`
              : null}
            ${!this.hasMoreData && this.page === 1
              ? html`<slot name="empty">
                  <div class="loaded">没有数据~</div>
                </slot>`
              : null}
          </div>
        </div>
      </div>
    `
  }

  static styles = css`
    .infinite-list-container {
      overflow: auto;
      position: relative;
      -webkit-overflow-scrolling: touch;
    }

    .infinite-list-phantom {
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      z-index: -1;
    }
    .infinite-list {
      left: 0;
      right: 0;
      top: 0;
      position: absolute;
    }
    .loaded {
      color: #999;
      font-size: 1.1rem;
      text-align: center;
      padding: 1rem;
    }
    @keyframes blink {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }
    .loading {
      font-size: 1.5rem;
      text-align: center;
      /* 动画闪烁 */
      animation: blink 1s linear infinite;
    }
  `
}

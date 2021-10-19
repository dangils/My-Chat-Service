//@ts-check
// IIFE 테크닉 :  브라우저에서 websocket 은닉

;(() => {
  const socket = new WebSocket(`ws://${window.location.host}/ws`)
  const formEl = document.getElementById('form')
  const chatsEl = document.getElementById('chats')
  /**@type {HTMLInputElement | null} */
  //@ts-ignore  //inputEl의 타입정보 정의
  const inputEl = document.getElementById('input')

  if (!formEl || !inputEl || !chatsEl) {
    //폼 타입이 아닐경우 에러
    throw new Error('Init faild!')
  }

  /**
   * @type {Chat[]}
   */
  const chats = []

  //닉네임 랜덤으로 정하기
  const adjectives = ['멋진', '날쌘', '용감한', '새침한', '당당한']
  const man = ['코끼리', '호랑이', '사자', '갈매기', '원숭이']

  /**
   * @param {string[]} array
   * @return {string}
   */
  function pickRandom(array) {
    const randomIdx = Math.floor(Math.random() * array.length)
    //랜덤 인덱스 = 0~1사이 수 * 배열 길이, math.floor(정수화)
    const result = array[randomIdx]
    if (!result) {
      throw new Error('array length is 0')
    }
    return result
  }

  const myname = `${pickRandom(adjectives)} ${pickRandom(man)}`

  formEl.addEventListener('submit', (event) => {
    event.preventDefault()
    //page refresh 햇을때 수행하는것 방지
    socket.send(
      JSON.stringify({
        nickname: myname,
        message: inputEl.value,
      })
    )
    inputEl.value = ''
  })

  // socket.addEventListener("open", () => {
  //   //소켓이 열렷을때 메서드 수행
  // });

  const drawChats = () => {
    chatsEl.innerHTML = ''
    chats.forEach(({ message, nickname }) => {
      const div = document.createElement('div')
      div.innerText = `${nickname}:${message}`
      chatsEl.appendChild(div)
    })
  }

  //메세지를 받았을 때 아래 수행

  // socket.addEventListener(`${message} 메세지`, (event) => {});
  socket.addEventListener('message', (event) => {
    const { type, payload } = JSON.parse(event.data)

    if (type === 'sync') {
      const { chats: syncedChats } = payload
      chats.push(...syncedChats)
    } else if (type === 'chat') {
      const chat = payload
      chats.push(chat)
    }

    drawChats()
  })
})()

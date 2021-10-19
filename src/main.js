//@ts-check

//Template engine : Pug
// CSS framework : TailwindCSS

const Koa = require('koa')
const Pug = require('koa-pug')
const path = require('path')
const route = require('koa-route')
const serve = require('koa-static')
const websockify = require('koa-websocket')
const mount = require('koa-mount')
// const { Socket } = require("dgram");
const mongoClient = require('./mongo')

const app = websockify(new Koa())

//@ts-ignore
new Pug({
  viewPath: path.resolve(__dirname, './views'), // 파일이 위치, 상대경로 나타댐
  app, // Binding `ctx.render()`, equals to pug.use(app)
})

app.use(mount('/public', serve('src/public')))

app.use(async (ctx) => {
  await ctx.render('main')
})

const _client = mongoClient.connect()

async function getChatsCollection() {
  const client = await _client
  return client.db('chat').collection('chats')
}

// Using routes
app.ws.use(
  //ws: 웹 소켓 미들웨어 사용
  route.all('/ws', async (ctx) => {
    //async 비동기식으로 설정하여 접근성 용이하게 함
    //웹소켓 접속 경로

    const chatsCollection = await getChatsCollection()
    //chat컬렉션 안에 chat 데이터 삽입
    const chatsCursor = chatsCollection.find(
      {},
      {
        sort: {
          createAt: 1,
        },
      }
    )

    const chats = await chatsCursor.toArray()
    //클라이언트 들에게 데이터 동기화
    ctx.websocket.send(
      JSON.stringify({
        // 새 클라이언트가 접속하면 이곳에서 데이터를 모아 전달 받음
        // 클라이언트에게 보내는 메세지는 sync와 chat 두가지 타입으로 설정
        type: 'sync',
        payload: {
          chats,
        },
      })
    )

    ctx.websocket.on('message', async (data) => {
      //소켓이 열릴때 이곳의 콜백 핸들러 반응
      if (typeof data !== 'string') {
        return
      }

      /**@type {Chat} */
      const chat = JSON.parse(data)

      await chatsCollection.insertOne({
        ...chat,
        createAt: new Date(),
      })

      const { nickname, message } = chat

      //브로드 캐스트 수행 -> 서버에 잇는 모든 웹소켓에 같은 정보를 내려줌
      const { server } = app.ws

      if (!server) {
        return
      }
      server.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: 'chat',
            payload: {
              message,
              nickname,
            },
          })
        )
      })
    })
  })
)

app.listen(5000)

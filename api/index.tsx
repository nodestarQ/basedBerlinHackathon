import { Button, Frog } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { Box, Heading, Text, VStack, vars, Image} from '../ui.js'
import {abi} from '../contract/abi/abi.js'

type State = {
  count: number
}
type CardArray = number[];
// Uncomment to use Edge Runtime.
// export const config = {
//   runtime: 'edge',
// }


export const app = new Frog<{ State: State }>({
  initialState: {
      count: 0
    },
  ui: { vars },
  assetsPath: '/',
  basePath: '/api',
  imageAspectRatio: '1:1',
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

app.frame('/', (c) => {
  const { buttonValue, deriveState } = c
  const state:any = deriveState(previousState => {
    if (buttonValue === 'clear') previousState.count = 0
  })
  return c.res({
    image: '/public/pack.jpg',
    intents: [
      <Button action='/tx'>Get Pack</Button>,
    ],
  })
})



app.frame('/tx', (c) => {
  return c.res({
    image: (
      <Box
        grow
        alignHorizontal="center"
        backgroundColor="background"
        padding="32"
      >
        <VStack gap="4">
          <Heading>tx</Heading>
          <Text color="text200" size="20">
            Preparing your Transaction
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button action='/unseal'>UNSEAL</Button>,
      <Button.Link href='https://basescan.org/tx/0xa7f19a029ebb67cd9ea2e247641468bd852af2cd37a2661d924c4613a84b4d54'>view on Blockexplorer</Button.Link>,
    ],
  })
})
/* 
start
card 1 (common)
card 2 (common)
...
card 5 (rare)
overview
*/
app.frame('/unseal', async (c) => {
  const { buttonValue, deriveState } = c
  const state:any = deriveState(previousState => {
    if (buttonValue === 'inc') previousState.count++
    if (buttonValue === 'dec') previousState.count--
    if (buttonValue === 'clear') previousState.count = 0
  })
  //SORT ARRAY COMMON 1-20 RARE 21-25
  let cardArray = [1,5,6,7,25];
  async function openPack(){
    let commonurl = '/bg/common.jpg';
    let rareurl = '/bg/rare.jpg';

    if(state.count == 0){
      return (<Box
        grow
        alignHorizontal="center"
        backgroundColor="background"
      >
        <img
        src='/bg/unseal.jpg'
        tw="absolute"
        height="100%"
      />
      <h1 tw="absolute">UNSEAL</h1>
      </Box>)
    }
    else if(state.count<=5){
      return (<Box
        padding="0"
        grow
        alignHorizontal="center"
        alignVertical="center" 
      >
      <img
        src={state.count<=4?commonurl:rareurl}
        tw="absolute"
        height="100%"
      />
        <img
        src={"/cards/"+cardArray[state.count-1]+".jpg"}
        tw="absolute"
        width="30%"
      />
    </Box>)
    }
    else{
      return (<Box
        grow
        alignHorizontal="center"
        backgroundColor="background"
      >
        <img
        src='/bg/overview.jpg'
        tw="absolute"
        height="100%"
      />
      <img
        src={"/cards/"+cardArray[0]+".jpg"}
        tw="absolute left-27% top-15%"
        width="15%"
      />
      <img
        src={"/cards/"+cardArray[1]+".jpg"}
        tw="absolute left-35% bottom-5%"
        width="15%"
      />
      <img
        src={"/cards/"+cardArray[2]+".jpg"}
        tw="absolute right-35% bottom-5%"
        width="15%"
      />
      <img
        src={"/cards/"+cardArray[3]+".jpg"}
        tw="absolute right-27% top-15%"
        width="15%"
      />
      <img
        src={"/cards/"+cardArray[4]+".jpg"}
        tw="absolute top-5%"
        width="15%"
      />
      </Box>)
    }
  }
  return c.res({
    image: (
      await openPack()
    ),
    intents: [
      state.count !== 0 && <Button value='dec'>⬅️</Button>,
      state.count <= 5 && <Button value="inc">{state.count <= 0? 'UNSEAL ✂️':'➡️'}</Button>,
      state.count == 6 && <Button action="/" value='clear'>GET ANOTHER PACK</Button>,
    ],
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

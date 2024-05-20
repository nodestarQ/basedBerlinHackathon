import { Button, Frog, parseEther} from 'frog'
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
    action:'/tx',
    image: '/public/pack.jpg',
    intents: [
      <Button.Transaction target='/tx'>Get Pack</Button.Transaction>,
    ],
  })
})

app
.transaction('/init-unpack', (c) => {
  // Send transaction response.
  return c.send({
    chainId: 'eip155:10',
    to: '0xd2135CfB216b74109775236E36d4b433F1DF507B',
    value: parseEther('0'),
  })
})


app.frame('/tx', (c) => {
  const { transactionId } = c
  return c.res({
    image: (<Box
      grow
      alignHorizontal="center"
      backgroundColor="background"
    >
      <img
      src='/bg/processing.jpg'
      tw="absolute"
      height="100%"
    />
    <h1 tw="absolute">PREPARING PACK</h1>
    <h5 tw="absolute bottom-5%">Wait a couple of seconds and then press unseal</h5>
    </Box>),
    intents: [
      <Button action='/unseal'>UNSEAL</Button>,
      <Button.Link href={'https://basescan.org/tx/'+transactionId}>view on Blockexplorer</Button.Link>,
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
  function sortArrayByRarity(arr: number[]): number[] {
    if (arr.length !== 5) {
        throw new Error("Array must contain exactly 5 elements.");
    }

    const common: number[] = [];
    const rare: number[] = [];

    // Separate the common and rare numbers
    for (const num of arr) {
        if (num >= 1 && num <= 20) {
            common.push(num);
        } else if (num >= 21 && num <= 25) {
            rare.push(num);
        } else {
            throw new Error("Numbers must be in the range 1-25.");
        }
    }

    // Check that there are 4 common and 1 rare numbers
    if (common.length !== 4 || rare.length !== 1) {
        throw new Error("Array must contain 4 common numbers (1-20) and 1 rare number (21-25).");
    }

    // Concatenate the common and rare numbers
    return common.concat(rare);
}
  //SORT ARRAY COMMON 1-20 RARE 21-25
  let cardArray = [1,5,6,25,7];
  async function openPack(cards: number[]){
    let commonurl = '/bg/common.jpg';
    let rareurl = '/bg/rare.jpg';
    let new_card = sortArrayByRarity(cards);

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
        src={"/cards/"+new_card[state.count-1]+".jpg"}
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
        src={"/cards/"+new_card[0]+".jpg"}
        tw="absolute left-27% top-15%"
        width="15%"
      />
      <img
        src={"/cards/"+new_card[1]+".jpg"}
        tw="absolute left-35% bottom-5%"
        width="15%"
      />
      <img
        src={"/cards/"+new_card[2]+".jpg"}
        tw="absolute right-35% bottom-5%"
        width="15%"
      />
      <img
        src={"/cards/"+new_card[3]+".jpg"}
        tw="absolute right-27% top-15%"
        width="15%"
      />
      <img
        src={"/cards/"+new_card[4]+".jpg"}
        tw="absolute top-5%"
        width="15%"
      />
      </Box>)
    }
  }
  return c.res({
    image: (
      await openPack(cardArray)
    ),
    intents: [
      state.count !== 0 && <Button value='dec'>⬅️</Button>,
      state.count <= 5 && <Button value="inc">{state.count <= 0? 'UNSEAL ✂️':'➡️'}</Button>,
      state.count == 6 && <Button action="/" value='clear'>GET ANOTHER PACK</Button>,
      state.count == 6 && <Button.Link href="https://acetcg.xyz/">VISIT ACETCG ↗️</Button.Link>,
    ],
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

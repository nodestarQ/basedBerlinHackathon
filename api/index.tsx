import { Button, Frog, parseEther} from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { Box, Heading, Text, VStack, vars, Image} from '../ui.js'
import {abi} from '../contract/abi/abi.js'

type PackState = {
  id: number,
  cards: number[]
}
type State = {
  count: number
  pack: PackState;
}
const contractAddy = '0x60CBA89e86619Fa17cf7Ee3246982f30eb12388C';
const graphApi = "https://acetcg.nodestarq.com";
// const graphApi = "http://localhost:42069"
const frameUrl = "https://based-berlin-hackathon.vercel.app/api/";

export const app = new Frog<{ State: State }>({
  initialState: {
      count: 0,
      pack: {
        id: 0,
        cards: []
      }
    },
  ui: { vars },
  assetsPath: '/',
  basePath: '/api',
  imageAspectRatio: '1:1'
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
})

app.frame('/', async (c) => {
  const { buttonValue, deriveState } = c
  //check if array gets returned for id threshhold if true display sold out
  let soldOut = false;
  const query = `
  query{boostersById(id: 10){
    tokenIds
    requestId
  }}
`;

try {
  const request = await fetch(graphApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  let response = await request.json();
  if(response.data.boostersById == undefined){
    soldOut = true;
  }

  console.log(soldOut);
} catch (error) {
  console.log("error: tx: ", error);
  // implement error handling
}

  const state:any = deriveState(previousState => {
    if (buttonValue === 'clear') previousState = {count: 0, pack:{id:0,cards:[]}}
  })
  return c.res({
    action:'/tx',
    image: '/pack.jpg',
    intents: [
      !soldOut && <Button.Transaction target='/init-unpack'>Get Pack</Button.Transaction>,
      soldOut && <Button action='/'>SOLD OUT</Button>
    ],
    title: 'Open your AceTCG Pack',
  })
})

app
.transaction('/init-unpack', (c) => {
  // Send transaction response.
  return c.contract({
    abi,
    functionName: 'open',
    chainId: 'eip155:8453', //change chain ID 84532 = sepolia base testnet
    to: contractAddy, //
    value: parseEther('0.0013'),
  })
})


app.frame('/tx', async (c) => {
  const { transactionId, buttonValue, deriveState } = c;
  const state:any = deriveState(previousState => {})
  let packData = false;
  let txId = transactionId;
if(transactionId==undefined){
    txId = `0x${buttonValue!.substring(2)}`
    }
  const firstquery = `
  {
    boostersByReq(
      id: "`+txId+`"
    ) {
      requestId
    }
  }
`;

try {
  const request = await fetch(graphApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query:firstquery })
  });
  let response = await request.json();
  let requestId = response.data.boostersByReq.requestId;
  const secondquery = `
    {
      boostersByIds(where:{requestId:"`+requestId+`"}) {
        items {
          tokenIds
        }
      }
    }
  `;
  try {
    const request = await fetch(graphApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query:secondquery })
    });
    let response = await request.json();
    let cards = response.data.boostersByIds.items[0].tokenIds;
    state.pack.cards = cards;
    
    state.pack.id = Number(requestId);
    packData = true;
  
  } catch (error) {
    console.log("error: tx2: ", error);
    // implement error handling
  }

} catch (error) {
  console.log("error: tx1: ", error);
  // implement error handling
}

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
    <h5 tw="absolute bottom-5%">Wait a couple of seconds and press CHECK until it turns into UNSEAL</h5>
    </Box>),
    intents: [
      packData?(<Button action='/unseal'>UNSEAL</Button>):(<Button value={txId}>CHECK</Button>),
      <Button.Link href={'https://basescan.org/tx/'+txId}>view on Blockexplorer</Button.Link>,
    ],
    title: 'Open your AceTCG Pack',
  })
})

app.frame('/unseal', async (c) => {
  const { buttonValue, deriveState } = c
  const state:any = deriveState(previousState => {
    if (buttonValue === 'inc') previousState.count++
    if (buttonValue === 'dec') previousState.count--
    if (buttonValue === 'clear') previousState = {count: 0, pack:{id:0,cards:[]}}
  })
  let castIntent = "https://warpcast.com/~/compose?text=Look%20what%20I%20pulled%20from%20my%20AceTCG%20booster%20pack&embeds[]="+frameUrl+"share/"+state.pack.id
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
  let cardArray = state.pack.cards;
  async function openPack(cards: number[]){
    let commonurl = '/bg/common.jpg';
    let rareurl = '/bg/rare.jpg';
    let new_card = sortArrayByRarity(cardArray);

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
      state.count == 6 && <Button.Link href={castIntent}>SHARE YOUR PACK</Button.Link>
    ],
    title: 'Open your AceTCG Pack',
  })
})

app.frame('/share/:id', async (c) => {
  const { buttonValue, deriveState } = c
  const id = c.req.param('id');
  const state:any = deriveState(previousState => {
    if (buttonValue === 'inc') previousState.count++
    if (buttonValue === 'dec') previousState.count--
    if (buttonValue === 'clear') previousState = {count: 0, pack:{id:0,cards:[]}}
  })
  const query = `
  {
    boostersByIds(where: {requestId: "`+id+`"}) {
      items {
        tokenIds
      }
    }
  }
`;

try {
  const request = await fetch(graphApi, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  let response = await request.json();
  let cards = response.data.boostersByIds.items[0].tokenIds;
  state.pack.cards = cards;
} catch (error) {
  console.log("error: tx: ", error);
  // implement error handling
}
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
  let cardArray = state.pack.cards;
  console.log(cardArray)
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
      <Button action="/" value='clear'>GET A PACK</Button>,
      state.count == 6 && <Button.Link href="https://acetcg.xyz/">VISIT ACETCG ↗️</Button.Link>
    ],
    title: 'Open your AceTCG Pack',
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

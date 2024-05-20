import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
// import { neynar } from 'frog/hubs'
import { handle } from 'frog/vercel'
import { Box, Heading, Text, VStack, vars } from '../ui.js'

type State = {
  count: number
}

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
  // const { buttonValue, inputText, status } = c
  return c.res({
    image: (
      <Box
        grow
        alignHorizontal="center"
        backgroundColor="background"
        padding="32"
      >
        <VStack gap="4">
          <Heading>Start</Heading>
          <Text color="text200" size="20">
            Open your Pack
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      <Button action='/tx'>Get Pack(tx)</Button>,
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
app.frame('/unseal', (c) => {
  const { buttonValue, deriveState } = c
  const state:any = deriveState(previousState => {
    if (buttonValue === 'inc') previousState.count++
    if (buttonValue === 'dec') previousState.count--
  })
  return c.res({
    image: (
      <Box
        grow
        alignHorizontal="center"
        backgroundColor="background"
        padding="32"
      >
        <VStack gap="4">
          <Heading>UNSEAL</Heading>
          <Text color="text200" size="20">
            Unseal Pack
            Card: {state.count}
          </Text>
        </VStack>
      </Box>
    ),
    intents: [
      state.count !== 0 && <Button value='dec'>⬅️</Button>,
      state.count <= 5 && <Button value="inc">➡️</Button>,
      state.count == 6 && <Button value="inc">GET ANOTHER PACK</Button>,
    ],
  })
})

// @ts-ignore
const isEdgeFunction = typeof EdgeFunction !== 'undefined'
const isProduction = isEdgeFunction || import.meta.env?.MODE !== 'development'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)

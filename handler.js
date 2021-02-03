const request = require('request-promise')
const trelloLib = require('node-trello')
const moment = require('moment-twitter')
const trello = new trelloLib(process.env.TRELLO_API_KEY, process.env.TRELLO_TOKEN)

const listIDs = [
    '5c0e2d9b435cec457df455e6', // Awaiting confirmation
    '58c9018928858ae3d5b4f7bf', // Homework
    '59969d518c2deae0fc900813', // Coming Up
    '5a5f0abb4fd66d321a39fb96', // Doing
    '5703bc33e6279b542c8c06de' // Ready
]

const userNames = {
  'erikapogorelc': 'erika', //'4ee705fbb53865990d2a7f89'
  'rodp': 'rodp', //'4f1953f8f80ef498151ac7ee'
  'jasaniklanovic': 'jasaniklanovic',
  'brihter': 'brihter'
}

exports.handler = (event, context) => {
  
  const users = Object.keys(userNames)

  users.forEach(user => {

    const trelloData = async () => {
      
      const member = await getTrelloData(`/1/members/${user}`)
      console.log(member)

      const query = `board:${process.env.TRELLLO_BOARD_ID} member:${member.id} -is:archived`
      console.log(query)

      const searchObj = await getTrelloData(`/1/search`, {query: query})
      console.log(searchObj)

      const cards = clean_closed(searchObj.cards)
      console.log(cards)
      
      const slack = await sendSlackMessage(user, cards)
      console.log(slack)
    }

    trelloData()
      .catch(error => console.log(`Error on request: ${error}`))
  })
}

function getTrelloData(url, query=null) {
  return new Promise((resolve, reject) => {
    trello.get(url, query, function (err, data) {
        if (err) {
          console.log(err)
          reject(err)
        }
        console.log(data)
        resolve(data)
      }
    )
  })
}

function clean_closed(cards_list) {
  let opened_cards = []

  cards_list.forEach(card => {
      if (!card.closed && listIDs.includes(card.idList)) {
        opened_cards.push(card)
      }
    })

  return opened_cards
}

function sendSlackMessage(user, cards) {
  const now = moment().format('MMM Do YY');
  const slackBody = {
    mkdn: true,
    text: `<@${userNames[user]}> your Influx depth counts ${cards.length} card(s): `,
    attachments: cards.map(card => ({
        color: moment(card.due).format('MMM Do YY') === now ? '#f28220' : 'good', // change to orange if due today
        text: `<${card.shortUrl}|${card.name}> *it's due ${moment(card.due).twitterLong()}*`
      }))
  }
  console.log(slackBody);
  const requestBody = {
        method: 'POST',
        body: slackBody,
        url: `https://hooks.slack.com/services/${process.env.SLACK_HOOK_URL}`,
        json: true
      }

  return new Promise((resolve, reject) => {
      request(requestBody, function (err, data) {
        if (err) {
          // log this here
          console.log(err)
          reject(err)
        }
        // log this here
        console.log(data)
        resolve(data)
      })
    })
}


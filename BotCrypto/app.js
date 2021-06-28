const express = require('express');

const app = express();
const path = require('path');
const api = require('./api');
const symbol = process.env.SYMBOL;
const coin = process.env.COIN;
const profitability = process.env.PROFITABILITY;


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/data', async (req, res) => {

    const data = {};

    const mercado = await api.depth(symbol);
    data.buy = mercado.bids.length ? mercado.bids[0][0] : 0;
    data.sell = mercado.asks.length ? mercado.asks[0][0] : 0;

    const carteira = await api.accountInfo();
    const coins = carteira.balances.filter(b => symbol.indexOf(b.asset) !== -1);
    data.coins = coins;

    const sellPrice = parseFloat(data.sell);
    const carteiraUSD = parseFloat(coins.find(c => c.asset.endsWith(coin)).free);
    
    if(sellPrice < 1000){
        //const qty = parseFloat((carteiraUSD / sellPrice)- 0.00001).toFixed(5);//calculo de quantidade
        //console.log(`qty ${qty}`);
        const qty = 1
        if(qty > 0){
           console.log('tenho grana, comprando agora !!')
           const buyOrder = await api.newOrder(symbol, qty);
           data.buyOrder = buyOrder;
           console.log(`orderId: ${buyOrder.orderId}`);
           console.log(`status: ${buyOrder.status}`);

         if(buyOrder.status === 'FILLED'){
           console.log("Posicionando a venda futura ...");
           const price = parseFloat(sellPrice * profitability).toFixed(5);
           console.log(`Vendendo por ${price} (${profitability})`)
           const sellOrder = await api.newOrder(symbol, 1, price, 'SELL', 'LIMIT');
           data.sellOrder = sellOrder;
           console.log(`orderId: ${sellOrder.orderId}`);
           console.log(`status: ${sellOrder.status}`);
        }
    }}
    
    
    res.json(data);
})


app.use('/', (req, res) =>{
    console.log('enTrou!');
    res.render('app', {
        symbol: process.env.SYMBOL,
        profitability: process.env.PROFITABILITY,
        lastUpdate: new Date(),
        interval: parseInt(process.env.CRAWLER_INTERVAL)
    });
})

app.listen(process.env.PORT, () => {
    console.log('App RodandO !');
})
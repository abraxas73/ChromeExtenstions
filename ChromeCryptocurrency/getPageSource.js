// @author Rob W <http://stackoverflow.com/users/938089/rob-w>
// Demo: var serialized_html = DOMtoString(document);


function getPriceValue() {
    var btcSell = 0;
    try {
        btcSell = document.querySelectorAll('.pricing-box-btc')[1].getAttribute("data-qty")
        console.log( btcSell  );
    } catch(exception) {
        console.log("Cannot get BTC price");
    }

    return btcSell;
}
chrome.runtime.sendMessage({
    action: "getSource",
    //source: DOMtoString(document)
    //source: document.title
    source: getPriceValue()
});
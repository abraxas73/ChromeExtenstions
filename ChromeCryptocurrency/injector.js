var PriceInfo = {
    WONFor555Dollars : 574000
};

chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        //message.innerText = request.source;

        console.log(request.source);
        message2.innerText = request.source;
        PriceInfo.btcPer550 = request.source;
        //inputSearch.value = searchWord;
        // 여기서 JIRA 실행 후.. 
        console.log("Searching.. " + document.getElementById('inputSearch').value);
        getBithumPrice(document.getElementById('inputSearch').value);
    }
});
  
function onWindowLoad() {

    var message = document.querySelector('#message');
    var message2 = document.querySelector('#message2');
    var message3 = document.querySelector('#message3');
    var inputSearch = document.querySelector('input[name="inputSearch"]');
    inputSearch.value = 'BTC';

    var btnSearch = document.getElementById('btnSearch');
    var btnClose = document.getElementById('btnClose');

    initialAutoSearch();

    // Ensure the background color is changed and saved when the dropdown
    // selection changes.
    btnSearch.addEventListener('click', () => {
        console.log("Searching.. " + document.getElementById('inputSearch').value);
        //getBithumPrice(document.getElementById('inputSearch').value);
        initialAutoSearch();
    });

    btnClose.addEventListener('click', () => {
        window.close();
    });
    

}

function initialAutoSearch() {
    chrome.tabs.executeScript(null, {
        file: "getPageSource.js"
    }, function() {

        console.log("executeScript executed");
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script : \n' + chrome.runtime.lastError.message;
        }
    });
}

function getBithumPrice(currencyType) {
    
    var getUrl = 'https://api.bithumb.com/public/ticker/' + currencyType;

    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getUrl, true);

    
    // Set correct header for form data 
    xhr.setRequestHeader('Content-type', 'application/json');
    
    // Handle request state change events
    xhr.onreadystatechange = function() { 
        // If the request completed
        if (xhr.readyState == 4) {
            //statusDisplay.innerHTML = '';
            message.innerText = '';
            if (xhr.status == 200) {
                // If it was a success, close the popup after a short delay
                var jsonText = xhr.responseText;
                //message.innerText = jsonText;
                //console.log("###" + jsonText);
                var returnHTML = parseResult(jsonText);
                message.innerHTML = returnHTML;

                var marginalPrice = PriceInfo.WONFor555Dollars / PriceInfo.btcPer550;
                var estimatedProfit = PriceInfo.koreanBTCPrice * PriceInfo.btcPer550 - PriceInfo.WONFor555Dollars;
                message2.innerText = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'WON' }).format( marginalPrice );
                if( estimatedProfit > 0 ) {
                    message3.innerHTML = "<span style='color:red'>Profit out of $525(570만) will be " + new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'WON' }).format( estimatedProfit ) + "</span>";
                } else {
                    message3.innerHTML = "<span style='color:blue'>Loss out of $525(570만) will be " + new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'WON' }).format( estimatedProfit ) + "</span>";
                }
                
                //window.setTimeout(window.close, 1000);
            } else {
                // Show what went wrong
                message.innerText = searchWord + ', Error : ' + xhr.statusText;
            }
        }
    };

    // Send the request and set status
    xhr.send();
}

function parseResult(jsonText) {
    
    var orgJson = JSON.parse(jsonText);
    console.log( orgJson.data );
    var priceInfo = orgJson.data;

    var returnHTML = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'WON' }).format(priceInfo.closing_price) + " at " + convertTimestamp(priceInfo.date/1000);

    PriceInfo.koreanBTCPrice = priceInfo.closing_price;
    
    return returnHTML;
}

function convertTimestamp(timestamp) {
    var d = new Date(timestamp * 1000),	// Convert the passed timestamp to milliseconds
          yyyy = d.getFullYear(),
          mm = ('0' + (d.getMonth() + 1)).slice(-2),	// Months are zero based. Add leading 0.
          dd = ('0' + d.getDate()).slice(-2),			// Add leading 0.
          hh = d.getHours(),
          h = hh,
          min = ('0' + d.getMinutes()).slice(-2),		// Add leading 0.
          ampm = 'AM',
          time;
              
      if (hh > 12) {
          h = hh - 12;
          ampm = 'PM';
      } else if (hh === 12) {
          h = 12;
          ampm = 'PM';
      } else if (hh == 0) {
          h = 12;
      }
      
      // ie: 2013-02-18, 8:35 AM	
      time = yyyy + '-' + mm + '-' + dd + ', ' + h + ':' + min + ' ' + ampm;
          
      return time;
  }

window.onload = onWindowLoad;
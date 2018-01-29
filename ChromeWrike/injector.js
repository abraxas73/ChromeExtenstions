chrome.runtime.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        //message.innerText = request.source;

        var searchWord = request.source;
        searchWord = searchWord.substring(0, searchWord.indexOf('-'));
        if( searchWord.indexOf('[') >= 0) {
            searchWord = searchWord.substring(searchWord.indexOf('[')+1, searchWord.indexOf(']'));
        } else {

        }
        searchWord = searchWord.trim();
        //message.innerText = searchWord;
        inputSearch.value = searchWord;
        // 여기서 JIRA 실행 후.. 
        getJIRATasks(searchWord);
    }
});
  


function initialAutoSearch() {
    chrome.tabs.executeScript(null, {
        file: "getPageSource.js"
    }, function() {

        console.log("executeScript executed");
        // If you try and inject into an extensions page or the webstore/NTP you'll get an error
        if (chrome.runtime.lastError) {
            message.innerText = 'There was an error injecting script ';
            console.log( chrome.runtime.lastError.message );
        }
    });
}

function getJIRATasks(searchWord) {
    var jiraID = document.getElementById('jira_id');
    var jiraPW = document.getElementById('jira_pw');
    var encodedCredential = btoa( jiraID.value + ":" + jiraPW.value);

    var encodedSearchWord = encodeURIComponent(searchWord);

    var getUrl = 'https://jira.astorm.com/rest/api/2/search?jql=Summary~\'' + encodedSearchWord +  '\' AND status!=Closed+order+by+status+asc,priority&fields=project,id,key,summary,status,priority,duedate&maxResults=100';

    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('GET', getUrl, true);

    
    // Set correct header for form data 
    xhr.setRequestHeader('Content-type', 'application/json');
    //xhr.setRequestHeader('Authorization', 'Basic YWJyYXhhczpMYXN0NHRpb24h'); // 이거 내꺼.
    xhr.setRequestHeader('Authorization', 'Basic ' + encodedCredential); // 이거 내꺼.
    console.log('Basic ' + encodedCredential);
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
                var returnHTML = parseJIRASearchResult(jsonText);
                message.innerHTML = returnHTML;
                //logoutJIRA();
                //window.setTimeout(window.close, 1000);
            } else {
                // Show what went wrong
                message.innerText = searchWord + ', Error : ' ;
                console.log( xhr.statusText );
            }
        }
    };

    // Send the request and set status
    xhr.send();
}



function logoutJIRA() {
    
    
    var getUrl = 'https://jira.astorm.com/rest/auth/1/session';

    // Set up an asynchronous AJAX POST request
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', getUrl, true);

    
    // Set correct header for form data 
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Basic YWJyYXhhczpMYXN0NHRpb24h'); // 이거 내꺼.
    
    // Handle request state change events
    xhr.onreadystatechange = function() { 
        // If the request completed
        if (xhr.readyState == 4) {
            //statusDisplay.innerHTML = '';
            if (xhr.status == 200) {
                console.log("Succesfully loggedout");
            } else {
            
            }
        }
    };

    // Send the request and set status
    xhr.send();
}

function parseJIRASearchResult(jsonText) {
    var orgJson = JSON.parse(jsonText);
    var returnHTML = "";
    console.log( orgJson.issues);
    if( orgJson.issues.length == 0) {
        returnHTML = "No Search Result";
    } else {
        returnHTML = "<ul>";
        for(key in orgJson.issues) {
            console.log("Processing.. " + key );
            var task = orgJson.issues[key];
            if( task.fields.status.name != 'Closed') { // 조건에서 처리하니까 필요 없음.
                console.log( task.key );
                var anchorHtml = "<img src='" + task.fields.priority.iconUrl+ "'>" + task.key + "[" + task.fields.status.name + "] :<a href='https://jira.astorm.com/browse/" + task.key + "' target='_blank'>" + task.fields.summary + "</a>"
                returnHTML += "<li>" +anchorHtml + "</li>";
                console.log( anchorHtml );
            }
        }
        returnHTML += "</ul>";
    }

    return returnHTML;
}

function saveCredential() {
    var jiraID = document.getElementById('jira_id');
    var jiraPW = document.getElementById('jira_pw');

    var credential = {};
    credential.id = jiraID.value;
    credential.pw = jiraPW.value;
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We omit the
    // optional callback since we don't need to perform any action once the
    // background color is saved.
    chrome.storage.sync.set({'jira_credential':credential});
}

function getSavedCredential(key, callback) {
    // See https://developer.chrome.com/apps/storage#type-StorageArea. We check
    // for chrome.runtime.lastError to ensure correctness even when the API call
    // fails.
    chrome.storage.sync.get('jira_credential', (credential) => {
        console.log("Get from Chrome storage ");
        console.log(credential);
        callback(chrome.runtime.lastError ? null : credential['jira_credential']);
    });
}

function onWindowLoad() {

    var message = document.querySelector('#message');
    var inputSearch = document.querySelector('input[name="inputSearch"]');
    inputSearch.value = 'Input Search Words';

    var btnSearch = document.getElementById('btnSearch');
    var btnClose = document.getElementById('btnClose');

    var jiraID = document.getElementById('jira_id');
    var jiraPW = document.getElementById('jira_pw');

    getSavedCredential('jira_credential', (credential) => {
        if (credential) {
            jiraID.value = credential.id;
            jiraPW.value = credential.pw;
        }
      });

    initialAutoSearch();

    inputSearch.addEventListener('keypress', (event) => {
        if(event.keyCode == 13) {
            getJIRATasks(document.getElementById('inputSearch').value);
        }
    });

    btnSearch.addEventListener('click', () => {
        console.log("Searching.. " + document.getElementById('inputSearch').value);
        getJIRATasks(document.getElementById('inputSearch').value);
    });

    btnClose.addEventListener('click', () => {
        window.close();
    });

    jiraID.addEventListener('blur', () => {
        saveCredential();
    });

    jiraPW.addEventListener('blur', () => {
        saveCredential();
    });
    

}

window.onload = onWindowLoad;
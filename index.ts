import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/libs'
//import * as fs from 'fs';
import { join } from 'path';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
    logseq.App.showMsg('Pseudo collab plugin enabled');
    //let userInfo = await logseq.App.getUserInfo();
    
    //console.log("Run: " + new Date());
    let pagePrefix = "_Pseudo-Collab-User-";
    await sleep(1000);
    
  //   let graph = await logseq.app.getcurrentgraph();
  //   let folder = graph.path;
  //   let data = "data";
  //   let filename = "test123.txt";
  //    fs.writefilesync(join(folder, filename), data, {
  //   flag: 'w',
  // });

  // const contents = fs.readfilesync(join(folder, filename), 'utf-8');
  // console.log(contents); // 👉️ "one two three four"
 
    let pages = await logseq.Editor.getAllPages();
    let PCPages = [];
    pages.forEach( p => {
       if(p.originalName.startsWith(pagePrefix)) {
           PCPages.push(p);
       }
    })
  
    let currentUser = "test";
    let userCollabPageName = pagePrefix + currentUser;
    let userCollabPage = null;
    PCPages.forEach(p => {

        if(p.originalName == userCollabPageName) {
            console.log("found");
            userCollabPage = p
        }
    })
    if(!userCollabPage) {
        console.log("not found");
        
        logseq.Editor.createPage(userCollabPageName,{},  {redirect: false, createFirstBlock: true, format: "markdown", journal: false});
        
    }

    //console.log(userInfo);
    //logseq.App.showMsg(userInfo);

    logseq.provideModel({
        async toolClick() {
            onUserMovedEvent();
        }
    })

    logseq.App.registerUIItem('toolbar', {
        key: 'logseq-pcollab',
        template: `
              <a data-on-click="toolClick"
               class="button">
               <i >P-C</i>
             </a>
                                         `
    })

    async function onUserMovedEvent() {
       
        let blockInfo = await logseq.Editor.getCurrentBlock();
        //console.log(blockInfo);
        if (blockInfo) {
            let page = await logseq.Editor.getPage(blockInfo.page.id);
            console.log(page);
        }


    }
    let keyList = [
        //Enter
        13,
        // tab
        9,
        //arrows
        37,
        38,
        39,
        40,
    ];
    top.document.addEventListener('keydown', function(e) {
        console.log("event:" + e.keyCode);
        keyList.forEach(k => {
            if (e.keyCode === k) {
                onUserMovedEvent();
            }
        })
    }, false)

   /* top.document.addEventListener('click', function(e) {
        console.log("mouse event click");
        onUserMovedEvent();
    }, false)

    top.document.addEventListener('auxclick', function(e) {
        console.log("mouse event click");
        onUserMovedEvent();
    }, false)*/
}





// bootstrap
logseq.ready(main).catch(console.error)


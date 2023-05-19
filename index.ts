import '@logseq/libs'
import { LSPluginBaseInfo } from '@logseq/libs/dist/libs'
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
//import * as fs from 'fs';
// import { join } from 'path';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const pagePCPrefix = "_Pseudo-Collab-User-";
const blockPCPrefix = "# Do not edit this page\nPlugin Pseudo Collab\n";

const settings: SettingSchemaDesc[] = [
    {
        key: 'currentUser',
        type: 'string',
        title: 'Username',
        description: 'Select a unique username for this device.',
        default: Date.now(),
    },

    {
        key: 'inactive',
        type: 'number',
        title: 'Inactive',
        description: 'How long (in minutes) a user have to be inactive to stop notifying the user is on the same page. Set to 0 to always notify.',
        default: 5,
    },
]


// Get all Pseudo Collab pages. Those pages keep record of which page a user is editing. There's one PC page per user.
async function getAllPCPages(): Promise<any[]> {

    let pages = await logseq.Editor.getAllPages();
    let PCPages = [];
    pages.forEach(p => {
        if (p.originalName.startsWith(pagePCPrefix)) {
            PCPages.push(p);
        }
    })
    return PCPages;
}

// Get all Pseudo Collab pages except user's page.
async function getOtherPCPages(currentUser: string): Promise<any[]> {
    let pages = await logseq.Editor.getAllPages();
    let PCPages = [];
    pages.forEach(p => {
        if (p.originalName.startsWith(pagePCPrefix) && p.originalName != pagePCPrefix + currentUser) {
            PCPages.push(p);
        }
    })
    return PCPages;
}

// Get user's Pseudo Collab page.
async function getUserPCPage(currentUser: string): Promise<any | null> {


    let userCollabPageName = pagePCPrefix + currentUser;

    let pages = await logseq.Editor.getAllPages();
    for (let i = 0; i < pages.length; i++) {
        let p = pages[i];
        if (p.originalName === pagePCPrefix + currentUser) {
            return p;
        }
    }
    return null;
}

async function main() {
    logseq.App.showMsg('Pseudo collab plugin enabled');
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

    let PCPages = await getAllPCPages();

    let currentUser = logseq.settings?.currentUser;
    let userCollabPageName = pagePCPrefix + currentUser;
    let userCollabPage = await getUserPCPage(currentUser);

    if (!userCollabPage) {
        console.log("not found");

        userCollabPage = await logseq.Editor.createPage(userCollabPageName, {}, { redirect: false, createFirstBlock: true, format: "markdown", journal: false });

    }

    let blocks = await logseq.App.getPageBlocksTree(userCollabPage.uuid);
    let userPCBlock = blocks[0];
    
    await logseq.Editor.updateBlock(userPCBlock.uuid, blockPCPrefix);

    logseq.onSettingsChanged(async (settings) => {
        logseq.Editor.deletePage(pagePCPrefix + currentUser);
        currentUser = settings?.currentUser;
        userCollabPageName = pagePCPrefix + currentUser;
        userCollabPage = await logseq.Editor.createPage(userCollabPageName, {}, { redirect: false, createFirstBlock: true, format: "markdown", journal: false });
    });

    interface IUserEditingPage {
        username: string;
        // pageName: string;
        pageOriginalName: string;
        // pageUuid: string;
    }
    async function isPageCurrentlyEditing(originalName: string): Promise<IUserEditingPage | null> {
        if (originalName) {
            let PCPages = await getOtherPCPages(currentUser);
            for (let x = 0; x < PCPages.length; x++) {
                let p = PCPages[x];

                let block = (await logseq.App.getPageBlocksTree(p.uuid))[0];
                let content = block.content;
                if (content) {

                    let arr = content.split('\n');
                    let iLastActivity = arr.findIndex(l => { return l.startsWith('date:') });
                    if (iLastActivity >= 0) {
                        
                        let lastActivity = arr[iLastActivity].substring(5); // 5 is length of "date:"
                        // Check if inactive                      
                        if (logseq.settings?.inactive > 0 && Date.now() < +lastActivity + (logseq.settings?.inactive * 60000)) {


                            let iOriginalName = arr.findIndex(l => {
                                return l.startsWith('originalName');
                            });
                            if (iOriginalName >= 0) {
                                let oName = arr[iOriginalName].split(':')[1];
                                // Check if user is on the same page as another user
                                if (oName === originalName) {

                                    return {
                                        username: p.originalName.substring(pagePCPrefix.length),
                                        pageOriginalName: oName
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }
        return null;
    }

    async function onUserMovedEvent() {

        let blockInfo = await logseq.Editor.getCurrentBlock();

        if (blockInfo) {
            let page = await logseq.Editor.getPage(blockInfo.page.id);
            let blocks = await logseq.App.getPageBlocksTree(userCollabPage.uuid);
            let targetBlock = blocks[0];
            let isEditing = page.originalName
            let editing = blockPCPrefix + "date:" + Date.now() + "\nuuid:" + page.uuid + "\noriginalName:" + isEditing;
            await logseq.Editor.updateBlock(targetBlock.uuid, editing);
            let otherIsEditing = await isPageCurrentlyEditing(isEditing);
            if (otherIsEditing) {
                logseq.App.showMsg(otherIsEditing.username + ' is currently editing this page: ' + otherIsEditing.pageOriginalName);
            }

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
        // console.log("event:" + e.keyCode);
        keyList.forEach(k => {
            if (e.keyCode === k) {
                onUserMovedEvent();
            }
        })
    }, false)

}





// bootstrap
logseq.useSettingsSchema(settings).ready(main).catch(console.error)


// Local emulator fixture only. Never connects to hosted Firebase.
const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');
const root = 'C:/Users/1080p/Desktop/personal projects/Forge';
const req = createRequire(path.join(root, 'package.json'));
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
const { initializeApp } = req('firebase-admin/app');
const { getFirestore, Timestamp } = req('firebase-admin/firestore');
const { getAuth } = req('firebase-admin/auth');
const ts = req('typescript');
const app = initializeApp({projectId:'demo-podium-portfolio'});
const db = getFirestore(app);
const auth = getAuth(app);
const source = fs.readFileSync(path.join(root, 'src/core/firebase/photographySeed.ts'),'utf8');
const fixture = source.slice(source.indexOf('export const APERTURE'), source.indexOf('/**\n * Seeds'));
const exportsFixture = {};
new Function('exports', ts.transpileModule(fixture,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exportsFixture);
const { APERTURE_26_CHALLENGE: challenge, APERTURE_26_FORM_SCHEMA: schema, APERTURE_26_RUBRIC: rubric } = exportsFixture;
const permsSource = fs.readFileSync(path.join(root,'src/core/rbac/permissions.ts'),'utf8');
const permissions = [...permsSource.slice(permsSource.indexOf('export const PERMISSIONS'),permsSource.indexOf('] as const')).matchAll(/'([a-zA-Z]+\.[a-zA-Z]+)'/g)].map(x=>x[1]);
const uid='portfolio_demo_organizer';
const orgId='org_demo';
const now=Timestamp.now();
const base={createdAt:now,updatedAt:now,createdBy:uid,schemaVersion:1};
async function main(){
  try { await auth.createUser({uid,email:'organizer@example.test',password:'PortfolioDemo2026!',displayName:'Demo Organizer',emailVerified:true}); } catch(e){if(e.code!=='auth/uid-already-exists')throw e;}
  const org=db.doc(`organizations/${orgId}`);
  await org.set({...base,id:orgId,name:'Portfolio Demo Institute',slug:'portfolio-demo',description:'Fictional local demo for portfolio screenshots.',type:'education',ownerId:uid,logoColor:'#EDD47C',initials:'PD',memberCount:4,challengeCount:1,plan:'free',status:'active'});
  await db.doc(`users/${uid}`).set({...base,id:uid,email:'organizer@example.test',displayName:'Demo Organizer',username:null,photoURL:null,isPublic:false,stats:{challengesEntered:0,challengesWon:0,submissions:0,points:0,badges:0,certificates:0,currentStreakDays:0,longestStreakDays:0}});
  await org.collection('members').doc(uid).set({...base,id:uid,userId:uid,email:'organizer@example.test',displayName:'Demo Organizer',photoURL:null,roleIds:['owner'],resolvedPermissions:permissions,status:'active',joinedAt:now});
  await org.collection('workspaces').doc('ws_creative').set({...base,id:'ws_creative',name:'Creative challenges',description:'Fictional demo workspace',challengeCount:1});
  await org.collection('formSchemas').doc(schema.id).set({...base,...schema,orgId});
  const ch=org.collection('challenges').doc(challenge.id);
  await ch.set({...base,...challenge,title:"Demo · Aperture '26",description:'Fictional photography competition for a local portfolio walkthrough. '+challenge.description,orgId,workspaceId:'ws_creative',formSchemaId:schema.id,formSchemaVersion:1,timeline:Object.fromEntries(Object.entries(challenge.timeline).map(([k,v])=>[k,Timestamp.fromDate(new Date(v))])),counters:{registrations:3,submissions:3,reviewsCompleted:2,reviewsPending:1},publishedAt:now});
  for(const criterion of rubric) await ch.collection('rubric').doc(criterion.id).set({...base,...criterion,weight:criterion.weight/100});
  for(const [i,name] of ['Asha Demo','Dev Demo','Mira Demo'].entries()){
    const rid=`demo_registration_${i+1}`, sid=`demo_submission_${i+1}`, userId=`demo_participant_${i+1}`;
    await ch.collection('registrations').doc(rid).set({...base,id:rid,challengeId:challenge.id,userId,name,email:`participant${i+1}@example.test`,avatarColor:['#D8AD59','#7E9D80','#8897B1'][i],team:null,status:'active',currentStageKey:'submission',formSchemaId:schema.id,formSchemaVersion:1,answers:{},checkedInAt:null});
    await ch.collection('submissions').doc(sid).set({...base,id:sid,challengeId:challenge.id,registrationId:rid,userId,participant:name,anonymizedLabel:`Entry ${i+1}`,stageKey:'submission',formSchemaId:schema.id,formSchemaVersion:1,answers:{},status:i===2?'underReview':'reviewed',submittedAt:now,isLate:false,clientSubmittedAt:now,serverReceivedAt:now,fileCount:1,reviewsDone:i===2?0:1,reviewsTotal:1,score:i===2?null:91-i*4,isProvisional:i===2,variance:0,attemptNumber:1,clientMutationId:`demo_${i}`});
  }
  console.log('Seeded fictional screenshots fixture in demo-podium-portfolio on localhost only.');
}
main().catch(e=>{console.error(e);process.exitCode=1});

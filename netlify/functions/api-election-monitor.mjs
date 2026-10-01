import store from './_shared/data-store.js';
import monitor from './_shared/election-monitor.js';
export default async (request) => {
  if (request.method !== 'GET') return new Response(null,{status:405,headers:{Allow:'GET'}});
  try {
    const report = monitor.publicReport(await store.getData('election-monitor-latest'));
    return Response.json(report || {schemaVersion:1,status:'unavailable',sources:[],message:'No persisted election monitor run is available.'},
      {status:report?200:503,headers:{'Cache-Control':'no-store'}});
  } catch (_) {
    return Response.json({schemaVersion:1,status:'unavailable',sources:[]},{status:503,headers:{'Cache-Control':'no-store'}});
  }
};
export const config = {path:'/api/election-monitor'};

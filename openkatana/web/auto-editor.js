'use strict';
const $=id=>document.getElementById(id);
let audioFile=null,videoFiles=[],referenceFile=null,projectId=null,uploadLimit=256*1024*1024;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function toast(s){const el=$('toast');el.textContent=s;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);}
function size(n){return n<1048576?(n/1024).toFixed(0)+' KB':(n/1048576).toFixed(1)+' MB';}
function update(){ $('s-audio').textContent=audioFile?.name||'غير مضاف';$('s-script').textContent=$('script').value.trim()?'تمت الإضافة':'غير مضاف';$('s-videos').textContent=videoFiles.length.toLocaleString('ar')+' مقاطع';$('s-reference').textContent=referenceFile?.name||'اختياري';$('count').textContent=$('script').value.length.toLocaleString('ar')+' حرف';}
function setStep(n){[...$('steps').children].forEach((li,i)=>{li.className=i<n?'done':i===n?'active':'';});}
async function request(path,body,method){const r=await fetch(path,{method:method||(body===undefined?'GET':'POST'),headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(r.status===401){location.href='/login';throw Error('انتهت الجلسة، سجّل الدخول مرة أخرى');}const d=await r.json();if(!r.ok)throw Error(d.error||r.statusText);return d;}
async function call(tool,args){const data=await request('/api/call',{tool,arguments:args,request_id:crypto.randomUUID()});return wait(data._hosted_job);}
async function wait(job){while(['queued','running'].includes(job.state)){toast('جاري تنفيذ '+job.tool+'...');await sleep(800);job=await request('/api/tool-jobs/'+job.id);}if(job.state!=='succeeded')throw Error(job.error||'تعذر تنفيذ '+job.tool);return job.result.result;}
async function upload(file){if(file.size>uploadLimit)throw Error('حجم الملف '+file.name+' أكبر من الحد المسموح ('+size(uploadLimit)+')');const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':file.name},body:file});const d=await r.json();if(!r.ok)throw Error(d.error||'فشل رفع '+file.name);return d.source;}
async function importFile(file,kind){const source=await upload(file);const asset=await call('import_media',{project_id:projectId,source,rights:'review_pending'});return {asset,source,kind};}
function fileRow(file){const row=document.createElement('div');row.className='file-row';const n=document.createElement('span');n.textContent=file.name;const s=document.createElement('small');s.textContent=size(file.size);row.append(n,s);return row;}
$('audio').addEventListener('change',()=>{audioFile=$('audio').files[0]||null;if(audioFile){$('audio-name').textContent=audioFile.name+' · '+size(audioFile.size);$('audio-preview').src=URL.createObjectURL(audioFile);$('audio-preview').hidden=false;}update();});
$('videos').addEventListener('change',()=>{videoFiles=Array.from($('videos').files||[]);$('video-list').replaceChildren(...videoFiles.map(fileRow));if(!videoFiles.length){const p=document.createElement('p');p.className='file-hint';p.textContent='لم تتم إضافة فيديوهات';$('video-list').append(p);}update();});
$('reference').addEventListener('change',()=>{referenceFile=$('reference').files[0]||null;$('reference-name').textContent=referenceFile?referenceFile.name+' · '+size(referenceFile.size):'لم تتم إضافة مرجع';update();});
$('script').addEventListener('input',update);
async function run(){
 const script=$('script').value.trim();if(!audioFile)return toast('أضف الملف الصوتي أولاً');if(!script)return toast('أضف النص أو السكريبت');if(!videoFiles.length)return toast('أضف فيديو خام واحداً على الأقل');
 $('start').disabled=true;$('result').hidden=true;
 try{
  const info=await request('/api/studio-info');uploadLimit=info.upload_bytes||uploadLimit;
  if(info.project_id){projectId=info.project_id;}else{const created=await call('create_project',{name:'مشروع مونتاج ذكي'});projectId=created.project_id;await request('/api/select-project',{project_id:projectId});}
  $('s-server').textContent='متصل';setStep(0);
  const imported=[];let audioAsset=null,referenceSource=null,audioDuration=0;
  const total=videoFiles.length+2+(referenceFile?1:0);let done=0;
  const tick=()=>toast('رفع واستيراد الملفات '+done+'/'+total);
  const a=await importFile(audioFile,'audio');audioAsset=a.asset;done++;tick();
  try{const meta=await call('inspect_media',{source:a.source});audioDuration=Number(meta.media?.format?.duration||0);}catch(_){}
  const clips=[];
  for(const f of videoFiles){const item=await importFile(f,'video');clips.push(item);done++;tick();}
  if(referenceFile){const ref=await upload(referenceFile);referenceSource=ref;done++;tick();}
  setStep(1);
  let referenceReport=null;
  if(referenceSource){referenceReport=await call('analyze_reference',{project_id:projectId,source:referenceSource,duration:Math.min(120,audioDuration||30)});setStep(2);}
  const [w,h]=$('format').value.split(',').map(Number);
  const seconds=Math.min(600,Math.max(1,audioDuration?audioDuration/clips.length:5));
  const planned=await call('plan_edit',{project_id:projectId,asset_ids:clips.map(x=>x.asset.id),recipe:$('recipe').value,seconds,width:w,height:h,fps:30,caption:''});
  const timeline=planned.timeline;
  if(audioAsset?.path){timeline.audio={mode:'mix',limiter:true,tracks:[{src:audioAsset.path,start:0,at:0,volume:1}]};}
  timeline.metadata={...(timeline.metadata||{}),creative_brief:script,workflow:'arabic-auto-editor-v1',reference_analysis:referenceReport?true:false};
  const saved=await call('save_timeline',{project_id:projectId,timeline,revision:null});
  setStep(3);
  toast('تم حفظ القصّة الأولية. جاري الرندر...');
  const rendered=await call('start_render',{project_id:projectId,request_id:crypto.randomUUID()});
  setStep(4);
  $('result').hidden=false;
  const secondsOut=(timeline.canvas.frames/timeline.canvas.fps).toFixed(1);
  $('result-text').textContent='تم إنشاء القصّة وحفظها. مدة الخط الزمني '+secondsOut+' ثانية. '+(audioDuration&&secondsOut<audioDuration-1?'تنبيه: مدة الفيديو أقصر من الصوت؛ تحتاج مقاطع إضافية أو تمديداً يدوياً. ':'')+(referenceReport?'تم تحليل الفيديو المرجعي. ':'')+'افتح الاستوديو لمراجعة التصدير.';
  $('studio-link').href='/';
  toast('اكتمل الرندر. افتح الاستوديو لمراجعة الفيديو وتنزيله.');
 }catch(e){toast(e.message);console.error(e);}
 finally{$('start').disabled=false;}
}
$('start').addEventListener('click',run);
(async()=>{try{const info=await request('/api/studio-info');uploadLimit=info.upload_bytes||uploadLimit;projectId=info.project_id||null;$('connection').textContent='خادم متصل · الحد '+size(uploadLimit);$('s-server').textContent='متصل';}catch(e){$('connection').textContent='تعذر الاتصال';toast(e.message);}})();
update();
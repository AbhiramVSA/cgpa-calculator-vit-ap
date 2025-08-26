const zlib = require('zlib');

const encoded = 'H4sIAAAAAAAAE62YXW_bNhSG_8q53AC3kOSkS3TnKVraIh8e5BUdhiGgqWPpbBTpkVQ2r-h_H_SRRiBVT1ZzY8C0TT8-PO_7HvoT5TGE0QK4xpysedBYkLGoMY_hMnodPL-CTMvBarFnMVy8Xr5ZAFe1Nmhi-O1Ts110efG09sBVjjEkWRoG7bd0q5aswBjWWm0FVpAp8UiygNo0j-uDLZV8fu9hjzGkm5svJDGcNQSFZs3eqwXgP6x6qJS0ZQzvmXwVBdHZl8_nZKymbW1JyRh-ST8voKe8dCjTJA2DwKP8qZY5q1BaJgyoHaQCudXEmQAm8_6pksQNpLIgiahJFpP5f5zJvwwCl__ueow_lYUgU8JOaUh3O-SWHhESVVW1JM6afY_CLl8ENnRgb1ebMBis9rAJE7wWtelo-3Ka2c1Qi4bvfAJf5PCt3_4aBsGFy3erctQS1uXBEJ_ONb9uS4cr22RhEJy5XO-k1SqvebMBWOVKywHdvP3K-c4V03JA1Eu-rd-ld74lVs0eh0478pG0kp24ILN1Tji_qPVk2HPfn6JgsNrD3m__QG7hXhNKi3lT1EKzqjpF3l5HToZ8M2pPSxfyigpqqnejCuJwhYaK-eY5XS8_-OYTjeh5aD5rrXZoDCnJxAv5z_RqupHU-Y9nlqv9XvRQrdlf0W6HGqWl3u6fFjhC-lfdvfGYuobVTmbTu1HVuYCnLtcFfq6ZtGRZ4_iLrkP6n_EB9ZYJWG1JkD1MtYfZ5Q_drGongsgr_4iNTVLcEcg79TgV0s2ozha8nr5ilkFmdc1trdG09VyJQmmyZTXbvk7gdLMqydLlWC9rSzviTee-kxaFoKLp25lZcAKfm1lpkkXjg8nTtASJoHaCegXZwVisxo1s_X4zgI0GsNlsWDe4OmMYsVnDNVqEW2ZLrJhtpfTcBVM9YP6pu6F1ez06QaW2bArZipyJ2iO7uf9KCdezydykyjbNeXuz011dYTc397bTQiaqkNSOpHOadH453QBrHcmfATK1s38zjbNme0dCq72eGK_hyA0qCgahO7CiLTNNV0pWYDNI9QKaPTOfAOmmUudD3rm7pn7LeEkS4aa5UX7DVWk6aeRdlZJ0zJESVe1rixrudcEk_dvGe-fvmpdksdX6TKmfgOsGUfoxiYJzb-jflAjXrEJtING0he8218n3Dt1dkkzT-wl4bv60lhl6TtTOUphD1gwgxn7DfekENjd7Wpc8CzyXlFbjXqPEWpuS9sfONHoJsURuznQm6Y1wq3aKQEvc-3sk-5OEOBo0R5zx_0l___wfWjBzTg0SAAA=';

function extractCoursesStructurally(text){
  const coursesIdx = text.indexOf('courses');
  if (coursesIdx === -1) throw new Error('No courses section');
  const after = text.slice(coursesIdx);
  const colonIdx = after.indexOf(':');
  const bracketStart = after.indexOf('[', colonIdx);
  let depth=0,endPos=-1;for(let i=bracketStart;i<after.length;i++){const ch=after[i];if(ch==='[')depth++;else if(ch===']'){depth--;if(depth===0){endPos=i;break;}}}
  const arrayContent = after.slice(bracketStart+1,endPos);
  const items=[];let buf='';let bDepth=0;for(let i=0;i<arrayContent.length;i++){const ch=arrayContent[i];if(ch==='{' ){if(bDepth===0)buf='';bDepth++;buf+=ch;continue;}if(bDepth>0){buf+=ch;if(ch==='}') {bDepth--; if(bDepth===0){items.push(buf);buf='';}}}}
  const pairRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^,}]+)\s*(?=,|})/g;
  const courses=[];for(const raw of items){const obj={};let m;while((m=pairRegex.exec(raw))){let key=m[1];let valRaw=m[2].trim();if((valRaw.startsWith('"')&&valRaw.endsWith('"'))||(valRaw.startsWith("'")&&valRaw.endsWith("'")))valRaw=valRaw.slice(1,-1);if(/^[0-9]+(\.[0-9]+)?$/.test(valRaw)) obj[key]=parseFloat(valRaw); else obj[key]=valRaw;}courses.push(obj);}return courses;
}

function filterValidCourses(raw){
  const gradePoints = {S:10,A:9,B:8,C:7,D:6,E:5,F:0,P:0};
  return raw.filter(c=>c.course_title && c.credits!=null && c.grade && gradePoints.hasOwnProperty(c.grade)).map(c=>({course_title: c.course_title, credits: typeof c.credits==='number'?c.credits:parseFloat(c.credits), grade:c.grade}));
}

function computeCgpa(courses){
  const gradePoints = {S:10,A:9,B:8,C:7,D:6,E:5,F:0,P:0};
  const valid = courses.filter(c=>c.grade!=='P');
  let totalCredits=0,totalPoints=0;for(const c of valid){totalCredits+=c.credits; totalPoints+= (gradePoints[c.grade]||0)*c.credits;}return totalCredits?totalPoints/totalCredits:0;
}

let s=encoded.replace(/-/g,'+').replace(/_/g,'/');const pad=s.length%4;if(pad) s+='='.repeat(4-pad);const buf=Buffer.from(s,'base64');const text=zlib.gunzipSync(buf).toString('utf8');
const rawCourses = extractCoursesStructurally(text);
const courses = filterValidCourses(rawCourses);
const cgpa = computeCgpa(courses);
console.log({rawCourseCount: rawCourses.length, filteredCourseCount: courses.length, cgpa: Number(cgpa.toFixed(2))});

require("dotenv").config();
const sequelize = require("./src/config/database");
async function colExists(t,c){const [r]=await sequelize.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:t AND COLUMN_NAME=:c",{replacements:{t,c}});return r.length>0;}
async function colNotNull(t,c){const [r]=await sequelize.query("SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:t AND COLUMN_NAME=:c",{replacements:{t,c}});return r.length>0&&r[0].IS_NULLABLE==="NO";}
(async()=>{
  await sequelize.authenticate();
  await sequelize.query("CREATE TABLE IF NOT EXISTS SequelizeMeta (name VARCHAR(255) NOT NULL PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  const checks=[
    {name:"20260817150202-alter-users-role-and-wilayah.js",done:async()=>true},
    {name:"20260817151532-create-activity-log.js",done:async()=>colExists("activity_log","id")},
    {name:"20260817152029-update-activity-log.js",done:async()=>colExists("activity_log","id")},
    {name:"20260817153101-add-deskripsi-to-activity-log.js",done:()=>colExists("activity_log","deskripsi")},
    {name:"20260817154856-add-user-id-to-laporan-polisi.js",done:()=>colExists("laporan_polisi","user_id")},
    {name:"20260817162557-add-polres-id-to-laporan-polisi.js",done:()=>colExists("laporan_polisi","polres_id")},
    {name:"20260817162736-make-polres-id-not-null.js",done:()=>colNotNull("laporan_polisi","polres_id")},
    {name:"20260820231500-move-jaminan-to-korban.js",done:async()=>(await colExists("korban","jenis_jaminan_id"))&&(await colExists("korban","keterjaminan_id"))&&(await colExists("korban","tindak_lanjut_id"))&&!(await colExists("laporan_polisi","jenis_jaminan_id"))},
  ];
  const [meta]=await sequelize.query("SELECT name FROM SequelizeMeta");
  const rec=new Set(meta.map(m=>m.name));
  const mark=[],skip=[];
  for(const c of checks){ if(rec.has(c.name))continue; if(await c.done())mark.push(c.name); else skip.push(c.name); }
  if(mark.length){const v=mark.map(n=>`(${sequelize.escape(n)})`).join(", ");await sequelize.query(`INSERT IGNORE INTO SequelizeMeta (name) VALUES ${v}`);}
  console.log("Ditandai selesai:");mark.forEach(n=>console.log("  +",n));
  console.log("Belum ditandai (perlu migrate betulan):");skip.forEach(n=>console.log("  !",n));
  await sequelize.close();
})();

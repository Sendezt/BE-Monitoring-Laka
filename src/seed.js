require("dotenv").config();
const bcrypt = require("bcrypt");
const sequelize = require("./config/database");

const {
  User,
  Wilayah,
  Polres,
  RumahSakit,
  Kecamatan,
  Kelurahan,
  Profesi,
  TindakLanjut,
  KasusTabrakKecelakaan,
  FaktorPenyebabLaka,
  SifatLaka,
  Cidera,
  Keterjaminan,
  JenisKendaraan,
  JenisJaminan,
  LaporanPolisi,
  Kendaraan,
  Korban,
} = require("./models");

async function seedDatabase() {
  try {
    console.log("Connecting to the database...");
    await sequelize.authenticate();

    console.log("Syncing database (force: true)... ini akan menghapus semua data yang ada!");
    await sequelize.sync({ force: true });

    console.log("1. Seeding Wilayah...");
    const wilayah = await Wilayah.create({ nama: "Jawa Tengah", is_active: true });

    console.log("2. Seeding Polres...");
    const polres = await Polres.create({ nama: "Polres Banjarnegara", wilayah_id: wilayah.id, is_active: true });

    console.log("3. Seeding Rumah Sakit...");
    const rs1 = await RumahSakit.create({ 
      nama: "RSUD Hj. Anna Lasmanah Banjarnegara", 
      nama_pic: "Dr. Anna",
      no_hp_pic: "08123456789",
      kode_rumah_sakit: "RS-01",
      wilayah_id: wilayah.id, 
      is_active: true 
    });
    const rs2 = await RumahSakit.create({ 
      nama: "RS Emanuel Klampok", 
      nama_pic: "Dr. Emanuel",
      no_hp_pic: "08987654321",
      kode_rumah_sakit: "RS-02",
      wilayah_id: wilayah.id, 
      is_active: true 
    });

    console.log("4. Seeding Kecamatan...");
    const kec1 = await Kecamatan.create({ nama: "Banjarnegara", polres_id: polres.id, is_active: true });
    const kec2 = await Kecamatan.create({ nama: "Purwareja Klampok", polres_id: polres.id, is_active: true });

    console.log("5. Seeding Kelurahan...");
    const kel1 = await Kelurahan.create({ nama: "Parakancanggah", kecamatan_id: kec1.id, is_active: true });
    const kel2 = await Kelurahan.create({ nama: "Klampok", kecamatan_id: kec2.id, is_active: true });

    console.log("6. Seeding Data Referensi...");
    const profesi = await Profesi.bulkCreate([
      { nama: "PNS", is_active: true },
      { nama: "Wiraswasta", is_active: true },
      { nama: "Karyawan Swasta", is_active: true },
      { nama: "Pelajar/Mahasiswa", is_active: true },
    ]);

    const tindakLanjut = await TindakLanjut.bulkCreate([
      { nama: "Terbit Jaminan", is_active: true },
      { nama: "Tidak Terjamin", is_active: true },
    ]);

    const kasusTabrak = await KasusTabrakKecelakaan.bulkCreate([
      { nama: "Tabrak Depan-Depan", is_active: true },
      { nama: "Tabrak Depan-Samping", is_active: true },
      { nama: "Tabrak Lari", is_active: true },
    ]);

    const faktorLaka = await FaktorPenyebabLaka.bulkCreate([
      { nama: "Human Error", is_active: true },
      { nama: "Faktor Kendaraan", is_active: true },
      { nama: "Faktor Jalan", is_active: true },
    ]);

    const sifatLaka = await SifatLaka.bulkCreate([
      { nama: "Luka Ringan", is_active: true },
      { nama: "Luka Berat", is_active: true },
      { nama: "Meninggal Dunia", is_active: true },
    ]);

    const cidera = await Cidera.bulkCreate([
      { nama: "Lecet", is_active: true },
      { nama: "Patah Tulang", is_active: true },
      { nama: "Gegar Otak", is_active: true },
    ]);

    const keterjaminan = await Keterjaminan.bulkCreate([
      { nama: "Terjamin Jasa Raharja", is_active: true },
      { nama: "Tidak Terjamin", is_active: true },
    ]);

    const jenisKendaraan = await JenisKendaraan.bulkCreate([
      { nama: "Sepeda Motor", is_active: true },
      { nama: "Mobil Penumpang", is_active: true },
      { nama: "Truk", is_active: true },
    ]);

    const jenisJaminan = await JenisJaminan.bulkCreate([
      { nama: "UU 34/1964", is_active: true },
      { nama: "UU 33/1964", is_active: true },
    ]);

    console.log("7. Seeding Users...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    const admin = await User.create({
      username: "admin",
      nama_lengkap: "Administrator",
      password: hashedPassword,
      role: "admin",
      wilayah_id: wilayah.id,
      is_active: true,
    });
    const pegawai = await User.create({
      username: "pegawai",
      nama_lengkap: "Pegawai Daerah",
      password: hashedPassword,
      role: "pegawai",
      wilayah_id: wilayah.id,
      is_active: true,
    });

    console.log("8. Seeding Laporan Polisi, Kendaraan, dan Korban...");
    const laporan = await LaporanPolisi.create({
      no_lp: "LP/123/VIII/2026/LANTAS",
      tanggal_laka: "2026-08-15",
      hari_kejadian: "Sabtu",
      tanggal_lp: "2026-08-16",
      telat_lp: 1,
      kecamatan_id: kec1.id,
      kelurahan_id: kel1.id,
      lokasi_laka: "Jl. Pemuda No. 45, Banjarnegara",
      rumah_sakit_id: rs1.id,
      rumah_sakit_wilayah: rs1.nama,
      laka_tunggal: false,
      tindak_lanjut_id: tindakLanjut[0].id,
      jenis_jaminan_id: jenisJaminan[0].id,
      keterjaminan_id: keterjaminan[0].id,
      kasus_tabrak_kecelakaan_id: kasusTabrak[0].id,
      faktor_penyebab_laka_id: faktorLaka[0].id,
      sifat_laka_id: sifatLaka[0].id,
      keterangan: "Terjadi tabrakan antara 2 sepeda motor di perempatan lampu merah.",
      user_id: pegawai.id,
      is_active: true,
    });

    const kend1 = await Kendaraan.create({
      laporan_polisi_id: laporan.id,
      peran: "korban",
      jenis_kendaraan_id: jenisKendaraan[0].id,
      nopol: "R 1234 AB",
      masa_laku_sw: "2027-01-01",
      is_active: true,
    });

    const kend2 = await Kendaraan.create({
      laporan_polisi_id: laporan.id,
      peran: "penjamin",
      jenis_kendaraan_id: jenisKendaraan[0].id,
      nopol: "R 5678 CD",
      masa_laku_sw: "2027-05-05",
      is_active: true,
    });

    await Korban.create({
      laporan_polisi_id: laporan.id,
      nama: "Budi Santoso",
      usia: 35,
      profesi_id: profesi[2].id,
      cidera_id: cidera[1].id,
      kendaraan_id: kend1.id,
      is_active: true,
    });

    await Korban.create({
      laporan_polisi_id: laporan.id,
      nama: "Agus Supriyanto",
      usia: 28,
      profesi_id: profesi[3].id,
      cidera_id: cidera[0].id,
      kendaraan_id: kend2.id,
      is_active: true,
    });

    console.log("✅ Seeding selesai dengan sukses!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding gagal:", error);
    process.exit(1);
  }
}

seedDatabase();

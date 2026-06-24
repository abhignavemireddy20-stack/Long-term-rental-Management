import dns from 'dns';

async function main() {
  const ip = '2406:da1c:61c:d601:179c:d8b2:a81c:513e';
  
  dns.reverse(ip, (err, hostnames) => {
    if (err) {
      console.log("Reverse DNS Error:", err.message);
    } else {
      console.log("Hostnames:", hostnames);
    }
  });
}

main().catch(console.error);

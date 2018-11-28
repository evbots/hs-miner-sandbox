const miner = require('hs-miner');

async function runMineBlock() {
  // Header without the appended solution.
  const hdr = Buffer.alloc(164, 0x00);

  if (miner.hasCUDA())
    console.log('Mining with cuda support!');

  console.log('CUDA devices:');
  console.log(miner.getDevices());

  // This mutates the last 4 bytes of the
  // buffer to increment a 32 bit nonce.
  // The header size _must_ be a multiple
  // of 4. This means the last 4 bytes of
  // a handshake header's 20 byte nonce
  // are used as the "regular nonce",
  // whereas the first 16 bytes are the
  // "extra nonces".

  const target = Buffer.alloc(32, 0xff);

  const [sol, nonce, match] = await miner.mineAsync(hdr, {
    backend: 'lean',
    nonce: 0,
    // range: 0xffffffff,
    // range: 39,
    range: 4294967295,
    target,
    threads: 100,
    trims: 256,
    device: 0
  });

  if (!sol) {
    console.log('No solution found for nonce range!');
    // At this point we would increment the other 16
    // bytes of the header's nonce and try again.
    return;
  }

  if (!match) {
    console.log('A solution was found, but it did not meet the target.');

    const hash = miner.sha3(sol);
    const share = miner.toShare(hash);

    // Log the best share (note: we could submit
    // the solution+nonce to a mining pool!).
    console.log('Best share: %d (%d).', share, nonce);

    // Now we should try again by changing
    // the first 16 bytes of the header nonce.
    return;
  }

  console.log('Solution:');
  console.log(miner.toArray(sol));
  console.log('Nonce: %d', nonce);
  console.log('Match: %s', match);
}

runMineBlock();

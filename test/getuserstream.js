const { exec } = require('child_process');
const fs = require('fs');

(() => {

    const today = new Date().getTime() + 120000;
    const dayToStartEvent = new Date().getTime();

    const duration = 310;
    const delay = (today - dayToStartEvent) / 1000;

    const segmentDuration = 7;
    const totalNumberOfSegment = duration / segmentDuration;
    const actualSegmentNumber = Math.floor(delay / segmentDuration);

    // segments
    const segments = []
    for (let i = actualSegmentNumber; i < totalNumberOfSegment; ++i) {
        segments.push(`http://localhost:3001/upload/events/room/1/segment${i.toString().padStart(5, '0')}.ts`)
    }

    const userStreamData = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:${duration}\n#EXT-X-MEDIA-SEQUENCE:${actualSegmentNumber}\n${segments.map(seg =>
        `#EXTINF:${segmentDuration},\n${seg}`
    ).join('\n')}\n#EXT-X-ENDLIST`;

    // create user streamable m3u8 file corresponding
    const user_file = `upload/events/room/1/u1.m3u8`;
    fs.writeFileSync(user_file, userStreamData);

    // exec(`echo ${userStreamData} > ${user_file}`, (error, _stdout, _stderr) => {
    //     if (error) {
    //         console.log('error occured ' + error.message);
    //     }
    // });
})();
<?php
if(isset($_GET["ip"])){
    $ip = $_GET["ip"];
}
else{
    http_response_code(400);
    exit;
}

?>

<html>
    <head></head>
    <body>
        <img id="image" width="640" height="480"/>
        <script>
            // The mjpeg url.
            const url = "http://<?php echo($ip); ?>/stream";

            const SOI = new Uint8Array(2);
            SOI[0] = 0xFF;
            SOI[1] = 0xD8;
            const CONTENT_LENGTH = 'content-length';
            const TYPE_JPEG = 'image/jpeg';
            let image = document.getElementById('image');
            let frame;

            fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw Error(response.status+' '+response.statusText)
                }

                if (!response.body) {
                    throw Error('ReadableStream not yet supported in this browser.')
                }
                
                const reader = response.body.getReader();

                let headers = '';
                let contentLength = -1;
                let imageBuffer = null;
                let bytesRead = 0;
                
                const read = () => {

                    reader.read().then(({done, value}) => {
                        if (done) {
                            controller.close();
                            return;
                        }
                        
                        for (let index =0; index < value.length; index++) {
                            
                            // we've found start of the frame. Everything we've read till now is the header.
                            if (value[index] === SOI[0] && value[index+1] === SOI[1]) {
                                // console.log('header found : ' + newHeader);
                                contentLength = getLength(headers);
                                // console.log("Content Length : " + newContentLength);
                                imageBuffer = new Uint8Array(new ArrayBuffer(contentLength));
                            }
                            // we're still reading the header.
                            if (contentLength <= 0) {
                                headers += String.fromCharCode(value[index]);
                            }
                            // we're now reading the jpeg. 
                            else if (bytesRead < contentLength){
                                imageBuffer[bytesRead++] = value[index];
                            }
                            // we're done reading the jpeg. Time to render it. 
                            else {
                                // console.log("jpeg read with bytes : " + bytesRead);
                                URL.revokeObjectURL(frame)
                                frame = URL.createObjectURL(new Blob([imageBuffer]));
                                image.src = frame;
                                frames++;
                                contentLength = 0;
                                bytesRead = 0;
                                headers = '';
                            }
                        }

                        read();
                    }).catch(error => {
                        console.error(error);
                    })
                }
                
                read();
                
            }).catch(error => {
                console.error(error);
            })

            const getLength = (headers) => {
                let contentLength = -1;
                headers.split('\n').forEach((header, _) => {
                    const pair = header.split(':');
                    if (pair[0].toLowerCase() === CONTENT_LENGTH) { 
                        contentLength = pair[1];
                    }
                })
                return contentLength;
            };

        </script>
        <style>
            body{
                margin:0;
            }
        </style>
    </body>
</html>


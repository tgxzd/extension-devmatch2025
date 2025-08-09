now every donator can donate to the streamer. But there are possibility that the donator will send unappropriate message to the streamer. So i need to use open ai to analyze the message and make the warning if the message content is unappropriate. 

Task
1. use open ai to analyze the message
2. when donator click donate. Ai will first check whether the message is clean or not. If the message is unappropriate, it will show warning when donator click donate.
3. then after user change their message to be better, only then the message successfully stored in donations.json
4. i will set the open ai api key in env
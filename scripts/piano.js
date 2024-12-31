
let audioContext;
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // 定义要显示的音符范围
        const noteRanges = [
            { octave: 2, notes: ['G', 'G#', 'A', 'A#', 'B'] },
            { octave: 3, notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] },
            { octave: 4, notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] },
            { octave: 5, notes: ['C', 'C#', 'D'] }
        ];

        function initAudio() {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const masterGain = audioContext.createGain();
            const compressor = audioContext.createDynamicsCompressor();
            
            compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
            compressor.knee.setValueAtTime(30, audioContext.currentTime);
            compressor.ratio.setValueAtTime(12, audioContext.currentTime);
            compressor.attack.setValueAtTime(0.003, audioContext.currentTime);
            compressor.release.setValueAtTime(0.25, audioContext.currentTime);
            
            masterGain.connect(compressor);
            compressor.connect(audioContext.destination);
            masterGain.gain.setValueAtTime(0.5, audioContext.currentTime);

            return masterGain;
        }

        function createPianoSound(frequency, velocity = 0.7, masterGain) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const now = audioContext.currentTime;

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(frequency, now);

            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(velocity, now + 0.02);
            gainNode.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.05);
            gainNode.gain.setTargetAtTime(velocity * 0.5, now + 0.05, 0.2);

            oscillator.connect(gainNode);
            gainNode.connect(masterGain);

            return { oscillator, gainNode };
        }

        function getFrequency(note, octave) {
            const noteIndex = notes.indexOf(note);
            const a4Frequency = 440;
            const a4Octave = 4;
            const a4NoteIndex = notes.indexOf('A');
            const numberOfHalfSteps = (octave - a4Octave) * 12 + (noteIndex - a4NoteIndex);
            return a4Frequency * Math.pow(2, numberOfHalfSteps / 12);
        }

        function createPiano() {
            const piano = document.getElementById('piano');

            noteRanges.forEach(range => {
                const octaveDiv = document.createElement('div');
                octaveDiv.className = 'octave';
                octaveDiv.style.position = 'relative';

                const label = document.createElement('div');
                label.className = 'octave-label';
                label.textContent = range.octave;
                octaveDiv.appendChild(label);

                range.notes.forEach(note => {
                    const key = document.createElement('div');
                    key.className = 'key' + (note.includes('#') ? ' black' : '');
                    key.dataset.note = note;
                    key.dataset.octave = range.octave;
                    key.dataset.frequency = getFrequency(note, range.octave);

                    octaveDiv.appendChild(key);
                });

                piano.appendChild(octaveDiv);
            });
        }

        let masterGain;
        let activeNotes = new Map();

        function playNote(frequency, velocity = 0.7) {
            if (activeNotes.has(frequency)) {
                stopNote(frequency);
            }

            const sound = createPianoSound(frequency, velocity, masterGain);
            sound.oscillator.start();
            activeNotes.set(frequency, sound);
        }

        function stopNote(frequency) {
            const sound = activeNotes.get(frequency);
            if (sound) {
                const now = audioContext.currentTime;
                sound.gainNode.gain.setTargetAtTime(0, now, 0.1);
                sound.oscillator.stop(now + 0.5);
                activeNotes.delete(frequency);
            }
        }

        document.addEventListener('click', () => {
            if (!audioContext) {
                masterGain = initAudio();
            }
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
        }, { once: true });

        createPiano();

        const piano = document.getElementById('piano');
        
        piano.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const key = e.target;
            if (key.classList.contains('key') && !key.classList.contains('active')) {
                key.classList.add('active');
                playNote(parseFloat(key.dataset.frequency));
            }
        }, false);

        piano.addEventListener('touchend', (e) => {
            e.preventDefault();
            const key = e.target;
            if (key.classList.contains('key')) {
                key.classList.remove('active');
                stopNote(parseFloat(key.dataset.frequency));
            }
        }, false);

        let isMouseDown = false;
        let lastPlayedKey = null;

        piano.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            const key = e.target;
            if (key.classList.contains('key')) {
                key.classList.add('active');
                playNote(parseFloat(key.dataset.frequency));
                lastPlayedKey = key;
            }
        });

        piano.addEventListener('mouseover', (e) => {
            if (isMouseDown) {
                const key = e.target;
                if (key.classList.contains('key') && key !== lastPlayedKey) {
                    key.classList.add('active');
                    playNote(parseFloat(key.dataset.frequency));
                    lastPlayedKey = key;
                }
            }
        });

        piano.addEventListener('mouseup', () => {
            isMouseDown = false;
            const keys = document.querySelectorAll('.key.active');
            keys.forEach(key => {
                key.classList.remove('active');
                stopNote(parseFloat(key.dataset.frequency));
            });
            lastPlayedKey = null;
        });

        piano.addEventListener('mouseleave', () => {
            isMouseDown = false;
            const keys = document.querySelectorAll('.key.active');
            keys.forEach(key => {
                key.classList.remove('active');
                stopNote(parseFloat(key.dataset.frequency));
            });
            lastPlayedKey = null;
        });

        piano.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });

        const keyboardMap = {
            'a': 'C', 'w': 'C#', 's': 'D', 'e': 'D#', 'd': 'E',
            'f': 'F', 't': 'F#', 'g': 'G', 'y': 'G#', 'h': 'A',
            'u': 'A#', 'j': 'B'
        };

        document.addEventListener('keydown', (e) => {
            if (!e.repeat && keyboardMap[e.key.toLowerCase()]) {
                const note = keyboardMap[e.key.toLowerCase()];
                const key = document.querySelector(`.key[data-note="${note}"][data-octave="4"]`);
                if (key && !key.classList.contains('active')) {
                    key.classList.add('active');
                    playNote(parseFloat(key.dataset.frequency));
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (keyboardMap[e.key.toLowerCase()]) {
                const note = keyboardMap[e.key.toLowerCase()];
                const key = document.querySelector(`.key[data-note="${note}"][data-octave="4"]`);
                if (key) {
                    key.classList.remove('active');
                    stopNote(parseFloat(key.dataset.frequency));
                }
            }
        });
        
        // 定义和弦数据
        const chords = {
            'F': ['F', 'A', 'C'],
            'C': ['C', 'E', 'G'],
            'C7': ['C', 'E', 'G', 'Bb'],
            'Bb': ['Bb', 'D', 'F'],
            'Gm': ['G', 'Bb', 'D'],
            'Dm': ['D', 'F', 'A'],
            'C/E': ['E', 'G', 'C'],
            'F/A': ['A', 'C', 'F'],
            'Bb/D': ['D', 'F', 'Bb'],
        };
        // Hey Jude 的音符数据
        const heyJudeSong = {
            tempo: 75, // BPM
            melody: [
                // 第一段
                { note: 'F', octave: 4, duration: 0.5, lyrics: "Hey" },
                { note: 'E', octave: 4, duration: 0.5, lyrics: "Jude" },
                { note: 'E', octave: 4, duration: 1.0, lyrics: "," },
                { note: 'C', octave: 4, duration: 0.5, lyrics: "don't" },
                { note: 'E', octave: 4, duration: 0.5, lyrics: "make" },
                { note: 'F', octave: 4, duration: 0.5, lyrics: "it" },
                { note: 'G', octave: 4, duration: 1.0, lyrics: "bad" },
                
                { note: 'F', octave: 4, duration: 0.5, lyrics: "Take" },
                { note: 'E', octave: 4, duration: 0.5, lyrics: "a" },
                { note: 'E', octave: 4, duration: 1.0, lyrics: "sad" },
                { note: 'C', octave: 4, duration: 0.5, lyrics: "song" },
                { note: 'E', octave: 4, duration: 0.5, lyrics: "and" },
                { note: 'F', octave: 4, duration: 0.5, lyrics: "make" },
                { note: 'E', octave: 4, duration: 1.0, lyrics: "it" },
                { note: 'D', octave: 4, duration: 1.0, lyrics: "bet-" },
                { note: 'C', octave: 4, duration: 1.0, lyrics: "ter" },

                // 第二段
                { note: 'G', octave: 4, duration: 0.5, lyrics: "Re-" },
                { note: 'F', octave: 4, duration: 0.5, lyrics: "mem" },
                { note: 'F', octave: 4, duration: 1.0, lyrics: "ber" },
                { note: 'D', octave: 4, duration: 0.5, lyrics: "to" },
                { note: 'F', octave: 4, duration: 0.5, lyrics: "let" },
                { note: 'G', octave: 4, duration: 0.5, lyrics: "her" },
                { note: 'A', octave: 4, duration: 1.0, lyrics: "in-" },
                { note: 'Bb', octave: 4, duration: 1.0, lyrics: "to" },
                { note: 'G', octave: 4, duration: 1.0, lyrics: "your" },
                { note: 'C', octave: 5, duration: 2.0, lyrics: "heart" },

                // 副歌
                { note: 'F', octave: 4, duration: 1.0, lyrics: "Na" },
                { note: 'C', octave: 5, duration: 1.0, lyrics: "na" },
                { note: 'Bb', octave: 4, duration: 1.0, lyrics: "na" },
                // ... 更多副歌部分
            ],
            
            chords: [
                // 第一段
                { chord: 'F', duration: 2.0 },
                { chord: 'C', duration: 2.0 },
                { chord: 'C7', duration: 2.0 },
                { chord: 'F', duration: 2.0 },
                
                { chord: 'Bb', duration: 2.0 },
                { chord: 'F', duration: 2.0 },
                { chord: 'C7', duration: 2.0 },
                { chord: 'F', duration: 2.0 },

                // 第二段
                { chord: 'F7', duration: 2.0 },
                { chord: 'Bb', duration: 2.0 },
                { chord: 'Gm', duration: 2.0 },
                { chord: 'C7', duration: 2.0 },

                // 副歌
                { chord: 'F', duration: 2.0 },
                { chord: 'C/E', duration: 2.0 },
                { chord: 'Dm', duration: 2.0 },
                { chord: 'C7', duration: 2.0 },
                // ... 更多和弦进行
            ]
        };

        // 添加控制按钮的HTML
        const controlsHTML = `
            <div class="controls" style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
                z-index: 1000;
            ">
                <button id="playButton" style="
                    padding: 10px 20px;
                    background: linear-gradient(45deg, #ff00ff, #00ffff);
                    border: none;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                ">Play Hey Jude</button>
               
            </div>
        `;

        // 将控制按钮添加到页面
        document.body.insertAdjacentHTML('beforeend', controlsHTML);

        let isPlaying = false;
        let currentTimeout = null;

        // 播放单个音符的函数
        function playNoteWithDuration(note, octave, duration, time = 0) {
            if (!isPlaying) return;

            const frequency = getFrequency(note, octave);
            const key = document.querySelector(`.key[data-note="${note}"][data-octave="${octave}"]`);

            currentTimeout = setTimeout(() => {
                if (key) key.classList.add('active');
                playNote(frequency, 0.7);

                // 停止音符并移除高亮
                setTimeout(() => {
                    if (key) key.classList.remove('active');
                    stopNote(frequency);
                }, duration * 900); // 稍微提前结束音符，使音符之间有间隔
            }, time * 1000);
        }
        // 播放和弦的函数
        function playChord(chordName, duration, velocity = 0.5) {
            if (!isPlaying) return;
            
            const chordNotes = chords[chordName];
            chordNotes.forEach((note, index) => {
                // 计算八度，低音音符降低一个八度
                const octave = index === 0 ? 3 : 4;
                const frequency = getFrequency(note, octave);
                const key = document.querySelector(`.key[data-note="${note}"][data-octave="${octave}"]`);
                
                if (key) key.classList.add('active');
                playNote(frequency, velocity * 0.6); // 和弦音量略小于旋律

                setTimeout(() => {
                    if (key) key.classList.remove('active');
                    stopNote(frequency);
                }, duration * 900);
            });
        }

        // 播放整个曲子的函数
        function playHeyJude() {
            if (isPlaying) return;
            isPlaying = true;

            const bpm = heyJudeSong.tempo;
            const beatDuration = 60 / bpm;

            let melodyTime = 0;
            let chordTime = 0;

            // 播放旋律
            heyJudeSong.melody.forEach(noteData => {
                const duration = noteData.duration * beatDuration;
                playNoteWithDuration(noteData.note, noteData.octave, duration, melodyTime);
                melodyTime += duration;
            });

            // 播放和弦
            heyJudeSong.chords.forEach(chordData => {
                const duration = chordData.duration * beatDuration;
                setTimeout(() => {
                    playChord(chordData.chord, duration);
                }, chordTime * 1000);
                chordTime += duration;
            });

            // 播放结束后重置状态
            const totalDuration = Math.max(melodyTime, chordTime);
            setTimeout(() => {
                isPlaying = false;
            }, totalDuration * 1000);
        }

        // 停止播放的函数
        function stopPlaying() {
            isPlaying = false;
            if (currentTimeout) {
                clearTimeout(currentTimeout);
            }
            // 清除所有活跃的音符
            const activeKeys = document.querySelectorAll('.key.active');
            activeKeys.forEach(key => {
                key.classList.remove('active');
                const frequency = parseFloat(key.dataset.frequency);
                stopNote(frequency);
            });

            if (audioContext) {
                const currentTime = audioContext.currentTime;
                // 创建一个快速淡出效果
                masterGainNode.gain.setValueAtTime(masterGainNode.gain.value, currentTime);
                masterGainNode.gain.linearRampToValueAtTime(0, currentTime + 0.1);
                
                // 短暂延迟后重置音量
                setTimeout(() => {
                    masterGainNode.gain.setValueAtTime(1, audioContext.currentTime);
                }, 100);
            }
        }

        // 添加按钮事件监听器
        document.getElementById('playButton').addEventListener('click', () => {
            if (!isPlaying) {
                playHeyJude();
            }
        });

        document.getElementById('stopButton').addEventListener('click', stopPlaying);

        // 为按钮添加触摸效果
        ['playButton', 'stopButton'].forEach(id => {
            const button = document.getElementById(id);
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                button.style.transform = 'scale(0.95)';
            });
            button.addEventListener('touchend', () => {
                button.style.transform = 'scale(1)';
            });
            button.addEventListener('mousedown', () => {
                button.style.transform = 'scale(0.95)';
            });
            button.addEventListener('mouseup', () => {
                button.style.transform = 'scale(1)';
            });
        });

        // 添加键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!isPlaying) {
                    playHeyJude();
                } else {
                    stopPlaying();
                }
            }
        }); 
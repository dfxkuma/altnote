import { useState, useEffect } from 'react';
import { Tabs, Tag, Modal, Input, Button } from 'antd';
import { useJoinRoomStore } from '../store';
import { database, auth } from '../firebase';
import { ref, get, set, onValue, off } from 'firebase/database';
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';

const initialItems = [
    {
        label: '환영합니다!',
        children: <p>위에 탭 추가 버튼을 눌러 메모를 작성하고 공유하세요!</p>,
        key: '0',
    },
];

const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8);
};

const Note = () => {
    const [activeKey, setActiveKey] = useState(initialItems[0].key);
    const [items, setItems] = useState(initialItems);
    const [editorHtml, setEditorHtml] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joinRoomId, setJoinRoomId] = useState('');
    const { roomId } = useJoinRoomStore((state) => state);

    const onChange = (newActiveKey) => {
        setActiveKey(newActiveKey);
    };

    const add = (name, children, key) => {
        const newPanes = [...items];
        newPanes.push({
            label: name,
            children: children,
            key: key,
        });
        setItems(newPanes);
        setActiveKey(key);
    };

    const remove = (targetKey) => {
        let newActiveKey = activeKey;
        let lastIndex = -1;
        items.forEach((item, i) => {
            if (item.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const newPanes = items.filter((item) => item.key !== targetKey);
        if (newPanes.length && newActiveKey === targetKey) {
            if (lastIndex >= 0) {
                newActiveKey = newPanes[lastIndex].key;
            } else {
                newActiveKey = newPanes[0].key;
            }
        }
        setItems(newPanes);
        setActiveKey(newActiveKey);
        const roomRef = ref(database, `rooms/${targetKey}`);
        set(roomRef, null);

        const userRef = ref(database, `users/${auth.currentUser.uid}/rooms`);
        get(userRef).then(snapshot => {
            if (snapshot.exists()) {
                const userRooms = snapshot.val().filter(room => room !== targetKey);
                set(userRef, userRooms);
            }
        });
    };

    const handleChange = (html, roomKey) => {
        setEditorHtml(html);
        const contentRef = ref(database, `rooms/${roomKey}/content`);
        set(contentRef, html);

        const activeRef = ref(database, `rooms/${roomKey}/active/${auth.currentUser.uid}`);
        set(activeRef, auth.currentUser.displayName);
    };

    const handleCreateNewNote = () => {
        const newRoomId = generateRoomId();
        const roomRef = ref(database, `rooms/${newRoomId}`);
        set(roomRef, {
            users: [auth.currentUser.displayName],
            content: '',
            active: {},
        });
        add(
            newRoomId,
            <div>
                <ReactQuill
                    value={editorHtml}
                    onChange={(html) => handleChange(html, newRoomId)}
                    modules={Note.modules}
                    formats={Note.formats}
                    style={{ height: '80vh' }}
                />
            </div>,
            newRoomId
        );

        const userRef = ref(database, `users/${auth.currentUser.uid}/rooms`);
        get(userRef).then(snapshot => {
            if (snapshot.exists()) {
                const userRooms = snapshot.val();
                set(userRef, [...userRooms, newRoomId]);
            } else {
                set(userRef, [newRoomId]);
            }
        });

        setIsModalVisible(false);
    };

    const handleJoinExistingNote = async () => {
        const roomRef = ref(database, `rooms/${joinRoomId}`);
        const snapshot = await get(roomRef);
        if (snapshot.exists()) {
            const roomData = snapshot.val();
            setEditorHtml(roomData.content)
            add(joinRoomId, <ReactQuill
                value={editorHtml}
                onChange={(html) => handleChange(html, joinRoomId)}
                modules={Note.modules}
                formats={Note.formats}
                style={{ height: '80vh' }}
            />, joinRoomId);

            onValue(roomRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setEditorHtml(data.content);
                }
            });

            const userRef = ref(database, `users/${auth.currentUser.uid}/rooms`);
            get(userRef).then(snapshot => {
                if (snapshot.exists()) {
                    const userRooms = snapshot.val();
                    set(userRef, [...userRooms, joinRoomId]);
                } else {
                    set(userRef, [joinRoomId]);
                }
            });

            setIsModalVisible(false);
        } else {
            alert('Invalid Room ID');
        }
    };

    const onEdit = (targetKey, action) => {
        if (action === 'add') {
            setIsModalVisible(true);
        } else {
            remove(targetKey);
        }
    };

    useEffect(() => {
        const checkRoom = async () => {
            if (roomId) {
                const roomRef = ref(database, `rooms/${roomId}`);
                const snapshot = await get(roomRef);
                if (snapshot.exists()) {
                    const roomData = snapshot.val();
                    setEditorHtml(prevState => ({ ...prevState, [roomId]: roomData.content }));
                    add(roomId, <ReactQuill
                        value={editorHtml[roomId] || ''}
                        onChange={(html) => handleChange(html, roomId)}
                        modules={Note.modules}
                        formats={Note.formats}
                        style={{ height: '80vh' }}
                    />, roomId);

                    onValue(roomRef, (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            setEditorHtml(prevState => ({ ...prevState, [roomId]: data.content }));
                        }
                    });

                    const activeRef = ref(database, `rooms/${roomId}/active`);
                    onValue(activeRef, (snapshot) => {
                        const activeData = snapshot.val();
                        if (activeData) {
                            setActiveUsers(Object.values(activeData));
                        } else {
                            setActiveUsers([]);
                        }
                    });

                    return () => {
                        off(roomRef);
                        off(activeRef);
                    };
                }
            }
        };


        const loadUserRooms = async () => {
            const userRef = ref(database, `users/${auth.currentUser.uid}/rooms`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userRooms = snapshot.val();
                userRooms.forEach(async (roomId) => {
                    const roomRef = ref(database, `rooms/${roomId}`);
                    const roomSnapshot = await get(roomRef);
                    if (roomSnapshot.exists()) {
                        const roomData = roomSnapshot.val();
                        setEditorHtml(prevState => ({ ...prevState, [roomId]: roomData.content }));
                        add(roomId, <ReactQuill
                            value={editorHtml[roomId] || ''}
                            onChange={(html) => handleChange(html, roomId)}
                            modules={Note.modules}
                            formats={Note.formats}
                            style={{ height: '80vh' }}
                        />, roomId);

                        onValue(roomRef, (snapshot) => {
                            const data = snapshot.val();
                            if (data) {
                                setEditorHtml(prevState => ({ ...prevState, [roomId]: data.content }));
                            }
                        });

                        const activeRef = ref(database, `rooms/${roomId}/active`);
                        onValue(activeRef, (snapshot) => {
                            const activeData = snapshot.val();
                            if (activeData) {
                                setActiveUsers(Object.values(activeData));
                            } else {
                                setActiveUsers([]);
                            }
                        });
                    }
                });
            }
        };

        checkRoom();
        loadUserRooms();
    }, [roomId, database]);

    return (
        <>
            <Tabs
                type="editable-card"
                onChange={onChange}
                activeKey={activeKey}
                onEdit={onEdit}
                items={items.map(item => ({
                    ...item,
                    children: (
                        <div>
                            <div style={{ marginBottom: '10px' }}>
                                {activeUsers.map(user => (
                                    <Tag color={user === auth.currentUser.displayName ? 'green' : 'gray'} key={user}>
                                        {user}
                                    </Tag>
                                ))}
                            </div>
                            {item.children}
                        </div>
                    ),
                }))}
            />
            <Modal
                title="노트 선택"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Button type="primary" onClick={() => setIsJoining(false)}>
                    새 노트 만들기
                </Button>
                <Button onClick={() => setIsJoining(true)}>
                    기존 노트 참여하기
                </Button>
                {isJoining && (
                    <>
                        <Input
                            placeholder="Room ID 입력"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value)}
                            style={{ marginTop: '10px' }}
                        />
                        <Button type="primary" onClick={handleJoinExistingNote} style={{ marginTop: '10px' }}>
                            참여
                        </Button>
                    </>
                )}
                {!isJoining && (
                    <Button type="primary" onClick={handleCreateNewNote} style={{ marginTop: '10px' }}>
                        새 노트 만들기
                    </Button>
                )}
            </Modal>
        </>
    );
};

Note.modules = {
    toolbar: [
        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['clean'],
    ],
};

Note.formats = [
    'header', 'font',
    'list', 'bullet',
    'bold', 'italic', 'underline',
    'color', 'background',
    'align',
];

export default Note;

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { Button, Modal, Input, Typography } from 'antd';
import styled from 'styled-components';
const { Title } = Typography;
import { useNavigate } from "react-router-dom";
import {useJoinRoomStore, useUserStore} from "../store";


const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Pretendard', sans-serif;
  text-align: center;
`;

const MainTitle = styled.h1`
  font-size: 3em;
`;

const Description = styled.p`
  font-size: 1.5em;
  margin: 20px 0;
`;

const App = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const {roomId, setRoomId} =  useJoinRoomStore((state) => state);
    const handleGoogleLogin = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider).then()
    };
    const handleModal = (roomId) => {
        if (roomId.length === 6) {
            setRoomId(roomId);
            setOpen(true);
        }
    }

    return (
        <Container>
            <MainTitle>altnote</MainTitle>
            <Description>간단하게 노트 작성하고 공유하기</Description>
            <Button type="primary" onClick={handleGoogleLogin}>
                Google 로그인
            </Button>
            <Title level={5}>또는 참가코드 입력하기</Title>
            <Input.OTP
                formatter={(str) => str.toUpperCase()}
                onChange={handleModal}
            />
            <Modal
              title="구글 로그인 필요"
              open={open}
              onOk={handleGoogleLogin}
              cancelText="취소"
              okText="로그인"
            >
                <p>{roomId}에 참가하려면 구글로 로그인하세요</p>
            </Modal>
        </Container>
    );
};

export default App;
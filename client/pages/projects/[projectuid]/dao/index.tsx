import React from "react";
import { FormEvent, useEffect, useState } from "react";
import Gun from "gun";
import s from "./dao.module.scss";
import { useRouter } from "next/router";

type Message = {
  text: string;
  id: string;
  createdAt?: number;
};

export default function Projects() {
  const router = useRouter();
  const { projectuid } = router.query;
  const [frozen, setFrozen] = useState(false);
  const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (projectuid) {
        const messageIds = new Set<string>();

        const chatRef = gun.get(`chats/${projectuid}`);
        chatRef.map().once((message: any, id: string) => {
          if (!messageIds.has(id)) {
            messageIds.add(id);
            setMessages((prevMessages) => [...prevMessages, { ...message, id }]);
          }
        });

        return () => {
          chatRef.off();
        };
      }
    };

    fetchMessages();
  }, [projectuid]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (message.trim() && projectuid) {
      const chatRef = gun.get(`chats/${projectuid}`);
      const newMessage = {
        text: message,
        createdAt: Gun.state(),
      };
      chatRef.set(newMessage, (ack) => {
          setMessage('');
      });
    }
  };

  return (
    <>
      {frozen ? (
        <p>freeze</p>
      ) : (
        <div className={s.main}>
          <div className={s.chat}>
            <h1>Chat</h1>
            <div>
              {messages.map((m) => (
                <div key={m.id}>{m.text}</div>
              ))}
            </div>
            <div className={s.input}>
              <form onSubmit={handleSubmit} className={s.input}>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="submit">↑</button>
              </form>
            </div>
          </div>
          <div className={s.milestones}>
            <h1>Milestone Submissions</h1>
          </div>
          <div className={s.voteFreeze}>
            <h1>Number of votes to freeze</h1>
            <p>5</p>
            <button>Freeze Project</button>
          </div>
        </div>
      )}
    </>
  );
}
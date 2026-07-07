import { Box, Flex, HStack, Icon, Text, useToast } from "@chakra-ui/react";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import { useEffect, useRef, useState } from "react";
import { VscChevronRight, VscFolderOpened, VscGist } from "react-icons/vsc";
import useLocalStorageState from "use-local-storage-state";

import Footer from "./Footer";
import Sidebar from "./Sidebar";
import type { ConnectionState } from "./ConnectionStatus";
import animals from "./animals.json";
import languages from "./languages.json";
import Rustpad, { UserInfo } from "./rustpad";
import useDocumentSocket from "./useDocumentSocket";
import useHash from "./useHash";

function getWsUri(id: string) {
  const url = new URL(`/api/socket/${id}`, window.location.origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.href;
}

function generateName() {
  return "Anonymous " + animals[Math.floor(Math.random() * animals.length)];
}

function generateHue() {
  return Math.floor(Math.random() * 360);
}

function App() {
  const toast = useToast();
  const [language, setLanguage] = useState("plaintext");
  const [connection, setConnection] = useState<ConnectionState>("loading");
  const [users, setUsers] = useState<Record<number, UserInfo>>({});
  const [name, setName] = useLocalStorageState("name", {
    defaultValue: generateName,
  });
  const [hue, setHue] = useLocalStorageState("hue", {
    defaultValue: generateHue,
  });
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const [darkMode, setDarkMode] = useLocalStorageState("darkMode", {
    defaultValue: false,
  });
  const rustpad = useRef<Rustpad>();
  const id = useHash();
  const socket = useDocumentSocket(getWsUri(id));

  useEffect(() => {
    editor?.updateOptions({ readOnly: connection !== "connected" });
  }, [editor, connection]);

  useEffect(() => {
    if (!editor?.getModel() || !socket) return;

    const model = editor.getModel()!;
    model.setValue("");
    model.setEOL(0); // LF
    rustpad.current = new Rustpad({
      uri: getWsUri(id),
      socket,
      editor,
      onConnected: () => setConnection("connected"),
      onDisconnected: () => setConnection("connecting"),
      onDesynchronized: () => {
        setConnection("desynchronized");
        toast({
          title: "Desynchronized with server",
          description: "Please save your work and refresh the page.",
          status: "error",
          duration: null,
        });
      },
      onChangeLanguage: (language) => {
        if (languages.includes(language)) {
          setLanguage(language);
        }
      },
      onChangeUsers: setUsers,
    });
    return () => {
      rustpad.current?.dispose();
      rustpad.current = undefined;
      setConnection(socket ? "connecting" : "loading");
    };
  }, [id, editor, socket, toast, setUsers]);

  useEffect(() => {
    if (!editor) {
      setConnection("loading");
    } else if (!socket) {
      setConnection("connecting");
    }
  }, [editor, socket]);

  useEffect(() => {
    if (connection === "connected") {
      rustpad.current?.setInfo({ name, hue });
    }
  }, [connection, name, hue]);

  function handleLanguageChange(language: string) {
    setLanguage(language);
    if (rustpad.current?.setLanguage(language)) {
      toast({
        title: "Language updated",
        description: (
          <>
            All users are now editing in{" "}
            <Text as="span" fontWeight="semibold">
              {language}
            </Text>
            .
          </>
        ),
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  }

  function handleDarkModeChange() {
    setDarkMode(!darkMode);
  }

  return (
    <Flex
      direction="column"
      h="100vh"
      overflow="hidden"
      bgColor={darkMode ? "#1e1e1e" : "white"}
      color={darkMode ? "#cbcaca" : "inherit"}
    >
      <Flex flex="1 0" minH={0}>
        <Sidebar
          documentId={id}
          connection={connection}
          darkMode={darkMode}
          language={language}
          currentUser={{ name, hue }}
          users={users}
          onDarkModeChange={handleDarkModeChange}
          onLanguageChange={handleLanguageChange}
          onChangeName={(name) => name.length > 0 && setName(name)}
          onChangeColor={() => setHue(generateHue())}
        />

        <Flex flex={1} minW={0} h="100%" direction="column" overflow="hidden">
          <HStack
            h={6}
            spacing={1}
            color="#888888"
            fontWeight="medium"
            fontSize="13px"
            px={3.5}
            flexShrink={0}
          >
            <Icon as={VscFolderOpened} fontSize="md" color="blue.500" />
            <Text>documents</Text>
            <Icon as={VscChevronRight} fontSize="md" />
            <Icon as={VscGist} fontSize="md" color="purple.500" />
            <Text>{id}</Text>
          </HStack>
          <Box flex={1} minH={0}>
            <Editor
              theme={darkMode ? "vs-dark" : "vs"}
              language={language}
              options={{
                automaticLayout: true,
                fontSize: 13,
                readOnly: connection !== "connected",
              }}
              onMount={(editor) => setEditor(editor)}
            />
          </Box>
        </Flex>
      </Flex>
      <Footer />
    </Flex>
  );
}

export default App;

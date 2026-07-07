import { HStack, Icon, Text } from "@chakra-ui/react";
import { VscCircleFilled } from "react-icons/vsc";

export type ConnectionState =
  | "loading"
  | "connecting"
  | "connected"
  | "desynchronized";

type ConnectionStatusProps = {
  connection: ConnectionState;
  darkMode: boolean;
};

function ConnectionStatus({ connection, darkMode }: ConnectionStatusProps) {
  return (
    <HStack spacing={1}>
      <Icon
        as={VscCircleFilled}
        color={
          {
            loading: "gray.400",
            connecting: "orange.500",
            connected: "green.500",
            desynchronized: "red.500",
          }[connection]
        }
      />
      <Text
        fontSize="sm"
        fontStyle="italic"
        color={darkMode ? "gray.300" : "gray.600"}
      >
        {
          {
            loading: "Loading editor...",
            connecting: "Connecting to the server...",
            connected: "You are connected!",
            desynchronized: "Disconnected, please refresh.",
          }[connection]
        }
      </Text>
    </HStack>
  );
}

export default ConnectionStatus;

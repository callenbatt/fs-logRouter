import { onMessagePublished } from "firebase-functions/v2/pubsub";

import { handleComposerSettingsUpdate } from "./handlers/composerSettingsUpdated";
import { handleComposerClientCreated } from "./handlers/composerClientCreated";

const TOPIC_NAME = "topic-name";

const ROUTES = [
  {
    // when a new composer client is created
    name: "composerClientCreated",
    eval: (json: any) => {
      return (
        json.logName === "projects/fs-prod-composer/logs/events" &&
        json.jsonPayload.involvedObject.name.includes("create-db") &&
        json.jsonPayload.message.includes("Successfully assigned")
      );
    },
    handler: handleComposerClientCreated,
  },
  {
    // when composer settings are updated
    name: "composerSettingsUpdate",
    eval: (json: any) => {
      return (
        json.jsonPayload.name === "SettingsController" &&
        json.jsonPayload.message === "Completed #update"
      );
    },
    handler: handleComposerSettingsUpdate,
  },
];

exports.hellopubsub = onMessagePublished(TOPIC_NAME, async (event) => {
  const json = event.data.message.json;

  if (!json) {
    console.error("Invalid message payload", event.data.message);
    return;
  }

  console.log("Received message", json);

  const route = ROUTES.find((route) => route.eval(json));

  if (!route) {
    console.log("No handler found for message", json);
    return;
  }

  console.log(`Processing message with handler ${route.name}`);

  await route.handler(json);

  console.log("Message processed");

  return;
});

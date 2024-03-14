import { Alert, Box, Button, Notification, Stack, rem } from "@mantine/core";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "../../state/hooks";
import { addPanel } from "../../state/queryPageSlice";
import Panel from "./QueryPanel";
import { LabelValuesResult } from "../../api/responseTypes/labelValues";
import { useAPIQuery } from "../../api/api";
import { useEffect, useState } from "react";
import { InstantQueryResult } from "../../api/responseTypes/query";
import { humanizeDuration } from "../../lib/formatTime";

export default function QueryPage() {
  const panels = useAppSelector((state) => state.queryPage.panels);
  const dispatch = useAppDispatch();
  const [timeDelta, setTimeDelta] = useState(0);

  const { data: metricNamesResult, error: metricNamesError } =
    useAPIQuery<LabelValuesResult>({
      path: "/label/__name__/values",
    });

  const { data: timeResult, error: timeError } =
    useAPIQuery<InstantQueryResult>({
      path: "/query",
      params: {
        query: "time()",
      },
    });

  useEffect(() => {
    if (timeResult) {
      if (timeResult.data.resultType !== "scalar") {
        throw new Error("Unexpected result type from time query");
      }

      const browserTime = new Date().getTime() / 1000;
      const serverTime = timeResult.data.result[0];
      setTimeDelta(Math.abs(browserTime - serverTime));
    }
  }, [timeResult]);

  return (
    <Box mt="xs">
      <Stack gap="sm">
        {metricNamesError && (
          <Alert
            icon={
              <IconAlertTriangle style={{ width: rem(14), height: rem(14) }} />
            }
            color="red"
            title="Error fetching metrics list"
            withCloseButton
          >
            Unable to fetch list of metric names: {metricNamesError.message}
          </Alert>
        )}
        {timeError && (
          <Alert
            icon={
              <IconAlertTriangle style={{ width: rem(14), height: rem(14) }} />
            }
            color="red"
            title="Error fetching server time"
            withCloseButton
          >
            {timeError.message}
          </Alert>
        )}
        {timeDelta > 30 && (
          <Alert
            title="Server time is out of sync"
            color="red"
            icon={
              <IconAlertCircle style={{ width: rem(14), height: rem(14) }} />
            }
            onClose={() => setTimeDelta(0)}
          >
            Detected a time difference of{" "}
            <strong>{humanizeDuration(timeDelta * 1000)}</strong> between your
            browser and the server. You may see unexpected time-shifted query
            results due to the time drift.
          </Alert>
        )}
      </Stack>

      <Stack gap="xl">
        {panels.map((p, idx) => (
          <Panel
            key={p.id}
            idx={idx}
            metricNames={metricNamesResult?.data || []}
          />
        ))}
      </Stack>

      <Button
        variant="light"
        mt="xl"
        leftSection={<IconPlus size={18} />}
        onClick={() => dispatch(addPanel())}
      >
        Add query
      </Button>
    </Box>
  );
}
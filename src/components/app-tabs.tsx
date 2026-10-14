import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs({ role }: { role: string }) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  const canSeeClients = role === "boss" || role === "seller";
  const canSeeSales =
    role === "boss" || role === "seller" || role === "customer";

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {canSeeClients && (
        <NativeTabs.Trigger name="clients">
          <NativeTabs.Trigger.Label>Clients</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "person.2", selected: "person.2.fill" }}
            md="group"
          />
        </NativeTabs.Trigger>
      )}

      {canSeeSales && (
        <NativeTabs.Trigger name="sales">
          <NativeTabs.Trigger.Label>
            {role === "customer" ? "My purchases" : "Sales"}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "cart", selected: "cart.fill" }}
            md="shopping_cart"
          />
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}

export default {
  async scheduled(event, env, ctx) {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.PROJECT_ID}/databases/(default)/documents:runQuery`;

    // 15 günü dolan ve daha önce bildirim gönderilmemiş randevuları çek
    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "appointments" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "nextReminderAt" },
                  op: "LESS_THAN_OR_EQUAL",
                  value: { integerValue: Date.now() }
                }
              },
              {
                fieldFilter: {
                  field: { fieldPath: "reminderSent" },
                  op: "EQUAL",
                  value: { booleanValue: false }
                }
              }
            ]
          }
        }
      }
    };

    const res = await fetch(firestoreUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody)
    });

    const results = await res.json();

    for (const r of results) {
      if (!r.document) continue;

      const docName = r.document.name;
      const data = r.document.fields;

      const customerUID = data.customerUID.stringValue;
      const businessID = data.businessID.stringValue;

      // Müşterinin push token’ını çek
      const userRes = await fetch(
        `https://firestore.googleapis.com/v1/${docName.split("appointments")[0]}users/${customerUID}`
      );

      const userData = await userRes.json();
      const pushToken = userData.fields?.pushToken?.stringValue;

      if (!pushToken) continue;

      // OneSignal bildirimi
      await fetch("https://api.onesignal.com/notifications", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          app_id: env.ONESIGNAL_APP_ID,
          include_subscription_ids: [pushToken],
          headings: { tr: "Yeni Bir Randevu Zamanı!" },
          contents: {
            tr: `${businessID} işletmesinden 15 gün geçti. Yeni bir randevu oluşturmak ister misiniz?`
          },
          url: "https://cepterandevu.github.io/3535/pages/booking.html"
        })
      });

      // reminderSent = true yap
      await fetch(`https://firestore.googleapis.com/v1/${docName}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: { reminderSent: { booleanValue: true } }
        })
      });
    }
  }
};
